-- Private admin notes on clients, waiver acceptance records, and a log of
-- outbound notification attempts (email/SMS adapters write here).

create table public.client_notes (
  id uuid primary key default gen_random_uuid(),
  client_email text not null,
  client_id uuid references auth.users(id),
  note text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index client_notes_client_email_idx on public.client_notes(client_email);
create index client_notes_client_id_idx on public.client_notes(client_id);

create trigger client_notes_set_updated_at
  before update on public.client_notes
  for each row execute function public.set_updated_at();

create table public.waiver_records (
  id uuid primary key default gen_random_uuid(),
  client_email text not null,
  client_id uuid references auth.users(id),
  service_id uuid references public.services(id),
  appointment_id uuid references public.appointments(id),
  waiver_version text not null default '2026-01',
  full_name text not null,
  signed_at timestamptz not null default now(),
  ip_address text,
  created_at timestamptz not null default now()
);

create index waiver_records_client_email_idx on public.waiver_records(client_email);
create index waiver_records_appointment_idx on public.waiver_records(appointment_id);

create type public.notification_channel as enum ('email', 'sms');

create table public.notification_log (
  id uuid primary key default gen_random_uuid(),
  channel public.notification_channel not null,
  template text not null,
  recipient text not null,
  appointment_id uuid references public.appointments(id) on delete set null,
  event_registration_id uuid references public.event_registrations(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  provider text not null default 'none',
  error_message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index notification_log_appointment_idx on public.notification_log(appointment_id);
create index notification_log_status_idx on public.notification_log(status);

alter table public.client_notes enable row level security;
alter table public.waiver_records enable row level security;
alter table public.notification_log enable row level security;

create policy "Client notes are admin only"
  on public.client_notes for all
  using (public.is_admin()) with check (public.is_admin());

create policy "Waivers viewable by admin or owner"
  on public.waiver_records for select
  using (public.is_admin() or client_id = auth.uid());
create policy "Waivers managed by admin only"
  on public.waiver_records for insert with check (public.is_admin());
-- Note: guest bookings that require a waiver are written by the
-- book_appointment() SECURITY DEFINER function (0008_functions.sql), which
-- bypasses this policy by design — the function itself validates the waiver
-- was accepted before inserting. Direct table inserts remain admin-only.

create policy "Notification log is admin only"
  on public.notification_log for all
  using (public.is_admin()) with check (public.is_admin());
