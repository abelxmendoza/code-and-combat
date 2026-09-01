-- Services catalog (Code + Combat offerings) and their locations

create type public.service_category as enum ('code', 'combat');
create type public.delivery_type as enum ('online', 'in-person', 'hybrid');

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text not null,
  full_description text not null,
  category public.service_category not null,
  duration_minutes int not null check (duration_minutes > 0 and duration_minutes <= 480),
  buffer_minutes int not null default 15 check (buffer_minutes >= 0 and buffer_minutes <= 120),
  price_cents int not null check (price_cents >= 0),
  price_unit text not null default 'session' check (price_unit in ('session', 'person')),
  delivery_type public.delivery_type not null,
  max_participants int not null default 1 check (max_participants >= 1),
  image_url text,
  preparation_instructions text,
  requires_waiver boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index services_category_idx on public.services(category) where deleted_at is null;
create index services_active_idx on public.services(active) where deleted_at is null;

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

create table public.service_locations (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  label text not null,
  address text,
  meeting_instructions text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index service_locations_service_id_idx on public.service_locations(service_id);

create trigger service_locations_set_updated_at
  before update on public.service_locations
  for each row execute function public.set_updated_at();

alter table public.services enable row level security;
alter table public.service_locations enable row level security;

create policy "Active services are public"
  on public.services for select
  using ((active = true and deleted_at is null) or public.is_admin());

create policy "Services are managed by admin only"
  on public.services for insert with check (public.is_admin());
create policy "Services are updated by admin only"
  on public.services for update using (public.is_admin());
create policy "Services are deleted by admin only"
  on public.services for delete using (public.is_admin());

create policy "Service locations are public"
  on public.service_locations for select using (true);
create policy "Service locations are managed by admin only"
  on public.service_locations for all using (public.is_admin()) with check (public.is_admin());
