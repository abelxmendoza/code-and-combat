-- Baseline table-level grants. Row Level Security policies (already enabled
-- on every table above) are what actually determine which *rows* anon /
-- authenticated can see or touch — these grants only unlock the *tables*.
-- Guest/client writes to appointments, participants, waivers, etc. are
-- intentionally NOT granted here; they can only happen through the
-- SECURITY DEFINER functions in 0008_functions.sql.

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;

grant insert, update, delete on public.services, public.service_locations,
  public.availability_rules, public.availability_overrides, public.calendar_blocks,
  public.booking_settings, public.appointments, public.appointment_participants,
  public.group_events, public.event_registrations, public.client_notes,
  public.waiver_records, public.notification_log, public.user_roles
  to authenticated;
-- (RLS still requires is_admin() for all of the above; this grant alone
-- does not let a non-admin authenticated user write anything.)
