-- Standalone workshops / bootcamps / group seminars, separate from the
-- regular 1:1 appointment calendar.

create table public.group_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  category public.service_category not null default 'code',
  start_time timestamptz not null,
  duration_minutes int not null check (duration_minutes > 0),
  capacity int not null check (capacity > 0),
  price_cents int not null check (price_cents >= 0),
  price_unit text not null default 'person' check (price_unit in ('session', 'person')),
  delivery_type public.delivery_type not null,
  location text,
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint group_events_start_future_hint check (duration_minutes <= 600)
);

create index group_events_start_time_idx on public.group_events(start_time);
create index group_events_status_idx on public.group_events(status);

create trigger group_events_set_updated_at
  before update on public.group_events
  for each row execute function public.set_updated_at();

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.group_events(id) on delete cascade,
  client_id uuid references auth.users(id),
  client_name text not null,
  client_email text not null,
  client_phone text,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'waitlisted')),
  management_token text not null unique,
  token_expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, client_email)
);

create index event_registrations_event_idx on public.event_registrations(event_id);
create index event_registrations_status_idx on public.event_registrations(status);

create trigger event_registrations_set_updated_at
  before update on public.event_registrations
  for each row execute function public.set_updated_at();

alter table public.group_events enable row level security;
alter table public.event_registrations enable row level security;

create policy "Scheduled events are public"
  on public.group_events for select
  using (status <> 'cancelled' or public.is_admin());
create policy "Group events managed by admin only"
  on public.group_events for insert with check (public.is_admin());
create policy "Group events updated by admin only"
  on public.group_events for update using (public.is_admin());
create policy "Group events deleted by admin only"
  on public.group_events for delete using (public.is_admin());

create policy "Registrations viewable by admin or self"
  on public.event_registrations for select
  using (public.is_admin() or client_id = auth.uid());
create policy "Registrations managed by admin only"
  on public.event_registrations for all
  using (public.is_admin()) with check (public.is_admin());
