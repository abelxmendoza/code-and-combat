-- Admin-only booking mutations that need the same atomic overlap/
-- availability guarantees as the guest flow, but authorized by is_admin()
-- instead of a management token (e.g. drag-and-drop rescheduling on the
-- admin calendar).

create or replace function public.admin_reschedule_appointment(
  p_appointment_id uuid,
  p_new_start_time timestamptz
) returns table (
  appointment_id uuid,
  start_time timestamptz,
  end_time timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appointment public.appointments%rowtype;
  v_service public.services%rowtype;
  v_new_end timestamptz;
begin
  if not public.is_admin() then
    raise exception 'NOT_AUTHORIZED' using errcode = 'P0001';
  end if;

  select * into v_appointment from public.appointments ap where ap.id = p_appointment_id for update;
  if not found then
    raise exception 'APPOINTMENT_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_appointment.status not in ('pending', 'confirmed') then
    raise exception 'APPOINTMENT_NOT_RESCHEDULABLE' using errcode = 'P0001';
  end if;

  select * into v_service from public.services sv where sv.id = v_appointment.service_id;
  v_new_end := p_new_start_time + make_interval(mins => v_service.duration_minutes);

  if not public.is_within_availability(p_new_start_time, v_new_end, v_service.category) then
    raise exception 'SLOT_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  begin
    update public.appointments
      set start_time = p_new_start_time, end_time = v_new_end
      where id = p_appointment_id;
  exception when exclusion_violation then
    raise exception 'SLOT_NOT_AVAILABLE' using errcode = 'P0001';
  end;

  return query select a.id, a.start_time, a.end_time from public.appointments a where a.id = p_appointment_id;
end;
$$;

grant execute on function public.admin_reschedule_appointment to authenticated;
