-- listUpcomingWorkshops() (lib/repository/supabase-repository.ts) queries
-- group_events with an embedded event_registrations(status) join so it can
-- compute confirmedCount client-side. But "Registrations viewable by admin
-- or self" (0006_group_events.sql) means an anonymous visitor's request
-- can't see ANY registration rows via RLS — PostgREST silently returns an
-- empty embed rather than an error, so confirmedCount always came out 0
-- and the public workshops page always showed full capacity, no matter how
-- many people had actually registered. A SECURITY DEFINER aggregate
-- function exposes only the count guests need, without exposing the
-- per-registration rows RLS is correctly hiding.
create or replace function public.list_upcoming_workshops()
returns table (
  id uuid,
  slug text,
  title text,
  description text,
  category public.service_category,
  start_time timestamptz,
  duration_minutes int,
  capacity int,
  price_cents int,
  price_unit text,
  delivery_type public.delivery_type,
  location text,
  status text,
  confirmed_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ge.id, ge.slug, ge.title, ge.description, ge.category, ge.start_time,
    ge.duration_minutes, ge.capacity, ge.price_cents, ge.price_unit,
    ge.delivery_type, ge.location, ge.status,
    coalesce(count(er.id) filter (where er.status = 'confirmed'), 0) as confirmed_count
  from public.group_events ge
  left join public.event_registrations er on er.event_id = ge.id
  where ge.status = 'scheduled' and ge.start_time >= now()
  group by ge.id
  order by ge.start_time asc;
$$;

grant execute on function public.list_upcoming_workshops to anon, authenticated;
