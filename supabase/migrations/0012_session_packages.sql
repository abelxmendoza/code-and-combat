-- Four-Session Package support, plus a small correctness fix to
-- book_appointment()'s location lookup (it previously always picked the
-- service's single "primary" location regardless of which delivery type
-- the client actually chose, which was wrong for hybrid services).

-- service_locations gains an explicit delivery_type so a hybrid service
-- (e.g. Coding & Tech Tutoring) can carry both an online and an in-person
-- location, and the booking function can pick the right one.
alter table public.service_locations
  add column delivery_type public.delivery_type;

create table public.session_packages (
  id uuid primary key default gen_random_uuid(),
  package_reference text not null unique,
  package_type public.service_category not null,
  client_name text not null,
  client_email text not null,
  client_phone text,
  notes text,
  total_sessions int not null default 4 check (total_sessions > 0),
  redeemed_sessions int not null default 0 check (redeemed_sessions >= 0),
  price_cents int not null check (price_cents >= 0),
  -- No payment processing yet (Stripe is a later phase) — every package
  -- starts here and an admin flips it to 'active' once payment is
  -- collected out of band. See lib/payments/adapter.ts.
  status text not null default 'pending_payment' check (
    status in ('pending_payment', 'active', 'expired', 'cancelled')
  ),
  management_token text not null unique,
  token_expires_at timestamptz not null,
  purchased_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint session_packages_redeemed_within_total check (redeemed_sessions <= total_sessions)
);

create index session_packages_client_email_idx on public.session_packages(client_email);
create index session_packages_status_idx on public.session_packages(status);

create trigger session_packages_set_updated_at
  before update on public.session_packages
  for each row execute function public.set_updated_at();

-- Extendable later: which appointments were paid for with package credit.
alter table public.appointments
  add column package_id uuid references public.session_packages(id);

create index appointments_package_id_idx on public.appointments(package_id) where package_id is not null;

alter table public.session_packages enable row level security;

create policy "Packages viewable by admin only"
  on public.session_packages for select using (public.is_admin());
create policy "Packages managed by admin only"
  on public.session_packages for all
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.generate_package_reference()
returns text
language sql
volatile
as $$
  select 'CC-PKG-' || to_char(now(), 'YYMMDD') || '-' || upper(encode(gen_random_bytes(3), 'hex'));
$$;

-- Records a package purchase. No charge happens here (Stripe isn't wired
-- up yet) — this only creates the pending-payment record; an admin marks
-- it 'active' once payment is collected out of band.
create or replace function public.purchase_session_package(
  p_package_type public.service_category,
  p_client_name text,
  p_client_email text,
  p_client_phone text,
  p_notes text
) returns table (
  package_id uuid,
  package_reference text,
  management_token text,
  total_sessions int,
  price_cents int,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reference text;
  v_token text;
  v_package_id uuid;
  v_price_cents constant int := 18000; -- $180 for 4 sessions, fixed server-side
  v_total_sessions constant int := 4;
begin
  if p_client_name is null or length(trim(p_client_name)) < 2 then
    raise exception 'INVALID_CLIENT_NAME' using errcode = 'P0001';
  end if;
  if p_client_email is null or p_client_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'INVALID_CLIENT_EMAIL' using errcode = 'P0001';
  end if;

  v_reference := public.generate_package_reference();
  v_token := encode(gen_random_bytes(32), 'hex');

  insert into public.session_packages (
    package_reference, package_type, client_name, client_email, client_phone, notes,
    total_sessions, price_cents, management_token, token_expires_at, expires_at
  ) values (
    v_reference, p_package_type, trim(p_client_name), lower(trim(p_client_email)), p_client_phone, p_notes,
    v_total_sessions, v_price_cents, v_token, now() + interval '1 year', now() + interval '6 months'
  )
  returning id into v_package_id;

  return query
    select sp.id, sp.package_reference, sp.management_token, sp.total_sessions, sp.price_cents, sp.status
    from public.session_packages sp where sp.id = v_package_id;
end;
$$;

grant execute on function public.purchase_session_package to anon, authenticated;

-- Fix: pick the location matching the delivery type the client actually
-- chose, falling back to whatever's marked primary if there's no exact
-- match (e.g. an in-person-only service with one location row).
create or replace function public.book_appointment(
  p_service_id uuid,
  p_start_time timestamptz,
  p_delivery_type public.delivery_type,
  p_client_name text,
  p_client_email text,
  p_client_phone text,
  p_notes text,
  p_client_timezone text,
  p_waiver_accepted boolean default false,
  p_client_id uuid default null
) returns table (
  appointment_id uuid,
  booking_reference text,
  management_token text,
  start_time timestamptz,
  end_time timestamptz,
  price_cents int,
  price_unit text,
  location text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service public.services%rowtype;
  v_settings public.booking_settings%rowtype;
  v_end_time timestamptz;
  v_existing public.appointments%rowtype;
  v_new_appointment_id uuid;
  v_reference text;
  v_token text;
  v_participant_count int;
  v_location text;
  v_is_new_appointment boolean := true;
begin
  select * into v_service from public.services
    where id = p_service_id and active = true and deleted_at is null;
  if not found then
    raise exception 'SERVICE_NOT_FOUND' using errcode = 'P0001';
  end if;

  select * into v_settings from public.booking_settings;

  if p_client_name is null or length(trim(p_client_name)) < 2 then
    raise exception 'INVALID_CLIENT_NAME' using errcode = 'P0001';
  end if;
  if p_client_email is null or p_client_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'INVALID_CLIENT_EMAIL' using errcode = 'P0001';
  end if;

  if v_service.delivery_type <> 'hybrid' and p_delivery_type <> v_service.delivery_type then
    raise exception 'INVALID_DELIVERY_TYPE' using errcode = 'P0001';
  end if;

  if v_service.requires_waiver and not p_waiver_accepted then
    raise exception 'WAIVER_REQUIRED' using errcode = 'P0001';
  end if;

  v_end_time := p_start_time + make_interval(mins => v_service.duration_minutes);

  if p_start_time < now() + make_interval(hours => v_settings.min_notice_hours) then
    raise exception 'OUTSIDE_NOTICE_WINDOW' using errcode = 'P0001';
  end if;
  if p_start_time > now() + make_interval(days => v_settings.booking_window_days) then
    raise exception 'OUTSIDE_BOOKING_WINDOW' using errcode = 'P0001';
  end if;

  if not public.is_within_availability(p_start_time, v_end_time, v_service.category) then
    raise exception 'SLOT_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  select coalesce(sl.address, sl.meeting_instructions) into v_location
    from public.service_locations sl
    where sl.service_id = p_service_id
    order by (sl.delivery_type = p_delivery_type) desc, sl.is_primary desc
    limit 1;

  if v_service.max_participants > 1 then
    select * into v_existing from public.appointments ap
      where ap.service_id = p_service_id
        and ap.start_time = p_start_time
        and ap.status in ('pending', 'confirmed')
      for update;

    if found then
      select count(*) into v_participant_count
        from public.appointment_participants app where app.appointment_id = v_existing.id;

      if v_participant_count >= v_existing.capacity then
        raise exception 'SESSION_FULL' using errcode = 'P0001';
      end if;

      if exists (
        select 1 from public.appointment_participants app
        where app.appointment_id = v_existing.id and app.client_email = lower(p_client_email)
      ) then
        raise exception 'ALREADY_BOOKED' using errcode = 'P0001';
      end if;

      v_new_appointment_id := v_existing.id;
      v_reference := v_existing.booking_reference;
      v_token := encode(gen_random_bytes(32), 'hex');
      v_is_new_appointment := false;
    end if;
  end if;

  if v_new_appointment_id is null then
    v_reference := public.generate_booking_reference();
    v_token := encode(gen_random_bytes(32), 'hex');

    begin
      insert into public.appointments (
        booking_reference, service_id, status, start_time, end_time,
        buffer_minutes, price_cents, price_unit, duration_minutes, capacity,
        delivery_type, location, client_timezone, notes,
        management_token, token_expires_at
      ) values (
        v_reference, p_service_id, 'confirmed', p_start_time, v_end_time,
        v_service.buffer_minutes, v_service.price_cents, v_service.price_unit,
        v_service.duration_minutes, v_service.max_participants,
        p_delivery_type, v_location, p_client_timezone, p_notes,
        v_token, now() + interval '1 year'
      )
      returning id into v_new_appointment_id;
    exception when exclusion_violation then
      raise exception 'SLOT_NOT_AVAILABLE' using errcode = 'P0001';
    end;
  end if;

  insert into public.appointment_participants (
    appointment_id, client_id, client_name, client_email, client_phone, is_primary_contact
  ) values (
    v_new_appointment_id, p_client_id, trim(p_client_name), lower(trim(p_client_email)), p_client_phone,
    v_is_new_appointment
  );

  if v_service.requires_waiver and p_waiver_accepted then
    insert into public.waiver_records (
      client_email, client_id, service_id, appointment_id, full_name
    ) values (
      lower(trim(p_client_email)), p_client_id, p_service_id, v_new_appointment_id, trim(p_client_name)
    );
  end if;

  return query
    select a.id, a.booking_reference, a.management_token, a.start_time, a.end_time,
           a.price_cents, a.price_unit, a.location
    from public.appointments a where a.id = v_new_appointment_id;
end;
$$;
