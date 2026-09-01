-- Recurring weekly availability, one-time overrides, hard blocks, and
-- global booking policy settings.

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  day_of_week int not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  category public.service_category, -- null = applies to both Code and Combat
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_rules_time_order check (end_time > start_time)
);

create index availability_rules_day_idx on public.availability_rules(day_of_week) where active;

create trigger availability_rules_set_updated_at
  before update on public.availability_rules
  for each row execute function public.set_updated_at();

-- One-time additions or removals of availability for a specific calendar date.
create table public.availability_overrides (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true, -- false = remove availability for this window
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_overrides_time_order check (end_time > start_time)
);

create index availability_overrides_date_idx on public.availability_overrides(date);

create trigger availability_overrides_set_updated_at
  before update on public.availability_overrides
  for each row execute function public.set_updated_at();

-- Hard blocks (vacation, travel, personal) that override everything else.
create table public.calendar_blocks (
  id uuid primary key default gen_random_uuid(),
  start_time timestamptz not null,
  end_time timestamptz not null,
  reason text not null default 'Unavailable',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_blocks_time_order check (end_time > start_time)
);

create index calendar_blocks_range_idx on public.calendar_blocks using gist (
  tstzrange(start_time, end_time, '[)')
);

create trigger calendar_blocks_set_updated_at
  before update on public.calendar_blocks
  for each row execute function public.set_updated_at();

-- Singleton table of global booking policy. Enforced with a check that
-- pins id to a fixed value so only one row can ever exist.
create table public.booking_settings (
  id boolean primary key default true check (id = true),
  business_timezone text not null default 'America/Los_Angeles',
  min_notice_hours int not null default 12 check (min_notice_hours >= 0),
  booking_window_days int not null default 45 check (booking_window_days > 0),
  cancellation_notice_hours int not null default 24 check (cancellation_notice_hours >= 0),
  reschedule_notice_hours int not null default 24 check (reschedule_notice_hours >= 0),
  hold_duration_minutes int not null default 5 check (hold_duration_minutes >= 0),
  updated_at timestamptz not null default now()
);

insert into public.booking_settings (id) values (true);

create trigger booking_settings_set_updated_at
  before update on public.booking_settings
  for each row execute function public.set_updated_at();

alter table public.availability_rules enable row level security;
alter table public.availability_overrides enable row level security;
alter table public.calendar_blocks enable row level security;
alter table public.booking_settings enable row level security;

create policy "Availability rules are public" on public.availability_rules for select using (true);
create policy "Availability rules managed by admin" on public.availability_rules for all
  using (public.is_admin()) with check (public.is_admin());

create policy "Availability overrides are public" on public.availability_overrides for select using (true);
create policy "Availability overrides managed by admin" on public.availability_overrides for all
  using (public.is_admin()) with check (public.is_admin());

create policy "Calendar blocks are public" on public.calendar_blocks for select using (true);
create policy "Calendar blocks managed by admin" on public.calendar_blocks for all
  using (public.is_admin()) with check (public.is_admin());

create policy "Booking settings are public" on public.booking_settings for select using (true);
create policy "Booking settings managed by admin" on public.booking_settings for update
  using (public.is_admin()) with check (public.is_admin());
