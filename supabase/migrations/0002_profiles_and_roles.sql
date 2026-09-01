-- Profiles (1:1 with auth.users) and role-based authorization

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  phone text,
  timezone text not null default 'America/Los_Angeles',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create type public.app_role as enum ('admin', 'client');

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create index user_roles_user_id_idx on public.user_roles(user_id);

-- Central admin check, used throughout RLS policies. SECURITY DEFINER so it
-- can read user_roles regardless of the caller's own row-level access.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- Auto-provision a profile + default 'client' role when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'client')
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

create policy "Profiles are viewable by owner or admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Profiles are editable by owner or admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin());

create policy "Roles are viewable by owner or admin"
  on public.user_roles for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Roles are managed by admin only"
  on public.user_roles for all
  using (public.is_admin())
  with check (public.is_admin());
