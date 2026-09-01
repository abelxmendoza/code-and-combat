-- Appointments: one row per bookable calendar slot (1:1 or group, up to
-- service.max_participants). Individual attendees live in
-- appointment_participants so a group slot can be joined incrementally.

create type public.appointment_status as enum (
  'pending',
  'confirmed',
  'completed',
  'cancelled_by_client',
  'cancelled_by_admin',
  'no_show'
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null unique,
  service_id uuid not null references public.services(id),
  status public.appointment_status not null default 'confirmed',

  start_time timestamptz not null,
  end_time timestamptz not null,
  -- Snapshotted from the service at booking time so later price/duration/
  -- buffer edits never retroactively change an existing appointment.
  buffer_minutes int not null default 0,
  price_cents int not null check (price_cents >= 0),
  price_unit text not null default 'session' check (price_unit in ('session', 'person')),
  duration_minutes int not null,
  capacity int not null default 1 check (capacity >= 1),

  delivery_type public.delivery_type not null,
  location text,
  client_timezone text not null default 'UTC',

  notes text,
  admin_notes text,

  -- Secure, tokenized self-service management links (guest-friendly).
  management_token text not null unique,
  token_expires_at timestamptz not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint appointments_time_order check (end_time > start_time),

  -- Buffered range used purely for conflict detection below. timestamptz
  -- arithmetic is only STABLE (not IMMUTABLE) in Postgres, so this can't be
  -- a GENERATED column — it's maintained by a BEFORE trigger instead.
  blocked_range tstzrange not null
);

-- A single instructor can only run one appointment slot at a time. Cancelled
-- / no-show appointments free up the calendar.
alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (blocked_range with &&)
  where (status in ('pending', 'confirmed'));

create or replace function public.set_appointment_blocked_range()
returns trigger
language plpgsql
as $$
begin
  new.blocked_range := tstzrange(
    new.start_time,
    new.end_time + make_interval(mins => new.buffer_minutes),
    '[)'
  );
  return new;
end;
$$;

create trigger appointments_set_blocked_range
  before insert or update of start_time, end_time, buffer_minutes on public.appointments
  for each row execute function public.set_appointment_blocked_range();

create index appointments_service_idx on public.appointments(service_id);
create index appointments_start_time_idx on public.appointments(start_time);
create index appointments_status_idx on public.appointments(status);
create index appointments_management_token_idx on public.appointments(management_token);

create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

-- Individual attendees of an appointment (the person who books is
-- participant #1; group services can add more up to capacity).
create table public.appointment_participants (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  client_id uuid references auth.users(id),
  client_name text not null,
  client_email text not null,
  client_phone text,
  is_primary_contact boolean not null default false,
  created_at timestamptz not null default now()
);

create index appointment_participants_appointment_idx on public.appointment_participants(appointment_id);
create index appointment_participants_client_idx on public.appointment_participants(client_id);
create index appointment_participants_email_idx on public.appointment_participants(client_email);

-- Audit-friendly status history.
create table public.appointment_status_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  from_status public.appointment_status,
  to_status public.appointment_status not null,
  changed_by uuid references auth.users(id),
  reason text,
  created_at timestamptz not null default now()
);

create index appointment_status_events_appointment_idx on public.appointment_status_events(appointment_id);

create or replace function public.log_appointment_status_change()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.appointment_status_events (appointment_id, from_status, to_status, changed_by)
    values (
      new.id,
      case when tg_op = 'INSERT' then null else old.status end,
      new.status,
      auth.uid()
    );
  end if;
  return new;
end;
$$;

create trigger appointments_log_status_change
  after insert or update of status on public.appointments
  for each row execute function public.log_appointment_status_change();

alter table public.appointments enable row level security;
alter table public.appointment_participants enable row level security;
alter table public.appointment_status_events enable row level security;

-- Direct table writes are admin-only; guest/client bookings go through the
-- SECURITY DEFINER book_appointment() function (see 0008_functions.sql) so
-- capacity/overlap/price rules are always enforced server-side.
create policy "Appointments viewable by admin or participant"
  on public.appointments for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.appointment_participants p
      where p.appointment_id = appointments.id and p.client_id = auth.uid()
    )
  );

create policy "Appointments managed by admin only"
  on public.appointments for insert with check (public.is_admin());
create policy "Appointments updated by admin only"
  on public.appointments for update using (public.is_admin());
create policy "Appointments deleted by admin only"
  on public.appointments for delete using (public.is_admin());

create policy "Participants viewable by admin or self"
  on public.appointment_participants for select
  using (public.is_admin() or client_id = auth.uid());
create policy "Participants managed by admin only"
  on public.appointment_participants for all
  using (public.is_admin()) with check (public.is_admin());

create policy "Status events viewable by admin only"
  on public.appointment_status_events for select using (public.is_admin());
