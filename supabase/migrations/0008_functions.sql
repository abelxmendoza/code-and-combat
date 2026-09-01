-- Server-side booking engine. These are the ONLY sanctioned write paths for
-- guest/client bookings — all direct table INSERT/UPDATE policies above are
-- admin-only, so price, duration, capacity, and overlap rules can never be
-- bypassed by a client-supplied payload.

create or replace function public.is_within_availability(
  p_start timestamptz,
  p_end timestamptz,
  p_category public.service_category
) returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tz text;
  v_local_start timestamp;
  v_local_end timestamp;
  v_date date;
  v_dow int;
  v_start_time time;
  v_end_time time;
begin
  select business_timezone into v_tz from public.booking_settings;

  if exists (
    select 1 from public.calendar_blocks b
    where tstzrange(b.start_time, b.end_time, '[)') && tstzrange(p_start, p_end, '[)')
  ) then
    return false;
  end if;

  v_local_start := p_start at time zone v_tz;
  v_local_end := p_end at time zone v_tz;
  v_date := v_local_start::date;
  v_dow := extract(dow from v_local_start)::int;
  v_start_time := v_local_start::time;
  v_end_time := v_local_end::time;

  if v_date <> v_local_end::date then
    return false; -- sessions must not cross midnight in business-local time
  end if;

  if exists (
    select 1 from public.availability_overrides o
    where o.date = v_date and o.is_available = false
      and o.start_time < v_end_time and o.end_time > v_start_time
  ) then
    return false;
  end if;

  if exists (
    select 1 from public.availability_overrides o
    where o.date = v_date and o.is_available = true
      and o.start_time <= v_start_time and o.end_time >= v_end_time
  ) then
    return true;
  end if;

  return exists (
    select 1 from public.availability_rules r
    where r.day_of_week = v_dow and r.active = true
      and (r.category is null or r.category = p_category)
      and r.start_time <= v_start_time and r.end_time >= v_end_time
  );
end;
$$;

create or replace function public.generate_booking_reference()
returns text
language sql
volatile
set search_path = public, extensions
as $$
  select 'CC-' || to_char(now(), 'YYMMDD') || '-' || upper(encode(gen_random_bytes(3), 'hex'));
$$;

-- Books (or joins) a single appointment slot for one client. Returns the
-- resulting appointment id, booking reference, and management token.
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
set search_path = public, extensions
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
    where sl.service_id = p_service_id and sl.is_primary = true
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

-- Cancels an appointment (or a single participant's spot on a group
-- appointment) using the guest management token. Enforces the cancellation
-- notice window from booking_settings.
create or replace function public.cancel_appointment_by_token(
  p_appointment_id uuid,
  p_token text,
  p_client_email text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appointment public.appointments%rowtype;
  v_settings public.booking_settings%rowtype;
  v_remaining_participants int;
begin
  select * into v_appointment from public.appointments
    where id = p_appointment_id and management_token = p_token
    for update;

  if not found or v_appointment.token_expires_at < now() then
    raise exception 'INVALID_OR_EXPIRED_TOKEN' using errcode = 'P0001';
  end if;

  if v_appointment.status not in ('pending', 'confirmed') then
    raise exception 'APPOINTMENT_NOT_CANCELLABLE' using errcode = 'P0001';
  end if;

  select * into v_settings from public.booking_settings;
  if v_appointment.start_time < now() + make_interval(hours => v_settings.cancellation_notice_hours) then
    raise exception 'OUTSIDE_CANCELLATION_WINDOW' using errcode = 'P0001';
  end if;

  delete from public.appointment_participants
    where appointment_id = p_appointment_id and client_email = lower(trim(p_client_email));

  select count(*) into v_remaining_participants
    from public.appointment_participants where appointment_id = p_appointment_id;

  if v_remaining_participants = 0 then
    update public.appointments set status = 'cancelled_by_client' where id = p_appointment_id;
  end if;

  return true;
end;
$$;

-- Reschedules a single-participant appointment to a new start time,
-- re-running every availability/overlap/notice check from scratch.
create or replace function public.reschedule_appointment_by_token(
  p_appointment_id uuid,
  p_token text,
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
  v_settings public.booking_settings%rowtype;
  v_new_end timestamptz;
begin
  select * into v_appointment from public.appointments
    where id = p_appointment_id and management_token = p_token
    for update;

  if not found or v_appointment.token_expires_at < now() then
    raise exception 'INVALID_OR_EXPIRED_TOKEN' using errcode = 'P0001';
  end if;
  if v_appointment.status not in ('pending', 'confirmed') then
    raise exception 'APPOINTMENT_NOT_RESCHEDULABLE' using errcode = 'P0001';
  end if;
  if v_appointment.capacity > 1 then
    raise exception 'GROUP_SESSIONS_NOT_RESCHEDULABLE' using errcode = 'P0001';
  end if;

  select * into v_settings from public.booking_settings;
  if v_appointment.start_time < now() + make_interval(hours => v_settings.reschedule_notice_hours) then
    raise exception 'OUTSIDE_RESCHEDULE_WINDOW' using errcode = 'P0001';
  end if;

  select * into v_service from public.services where id = v_appointment.service_id;
  v_new_end := p_new_start_time + make_interval(mins => v_service.duration_minutes);

  if p_new_start_time < now() + make_interval(hours => v_settings.min_notice_hours) then
    raise exception 'OUTSIDE_NOTICE_WINDOW' using errcode = 'P0001';
  end if;
  if not public.is_within_availability(p_new_start_time, v_new_end, v_service.category) then
    raise exception 'SLOT_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  begin
    update public.appointments
      set start_time = p_new_start_time, end_time = v_new_end, status = 'confirmed'
      where id = p_appointment_id;
  exception when exclusion_violation then
    raise exception 'SLOT_NOT_AVAILABLE' using errcode = 'P0001';
  end;

  return query select a.id, a.start_time, a.end_time from public.appointments a where a.id = p_appointment_id;
end;
$$;

-- Registers one attendee for a standalone group_event (workshop/bootcamp),
-- with capacity enforcement and automatic waitlisting once full.
create or replace function public.register_for_event(
  p_event_id uuid,
  p_client_name text,
  p_client_email text,
  p_client_phone text,
  p_client_id uuid default null
) returns table (
  registration_id uuid,
  status text,
  management_token text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_event public.group_events%rowtype;
  v_confirmed_count int;
  v_status text;
  v_token text;
  v_registration_id uuid;
begin
  select * into v_event from public.group_events ge
    where ge.id = p_event_id and ge.status = 'scheduled'
    for update;
  if not found then
    raise exception 'EVENT_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_event.start_time < now() then
    raise exception 'EVENT_ALREADY_STARTED' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.event_registrations er
    where er.event_id = p_event_id and er.client_email = lower(trim(p_client_email)) and er.status <> 'cancelled'
  ) then
    raise exception 'ALREADY_REGISTERED' using errcode = 'P0001';
  end if;

  select count(*) into v_confirmed_count
    from public.event_registrations er where er.event_id = p_event_id and er.status = 'confirmed';

  v_status := case when v_confirmed_count < v_event.capacity then 'confirmed' else 'waitlisted' end;
  v_token := encode(gen_random_bytes(32), 'hex');

  insert into public.event_registrations (
    event_id, client_id, client_name, client_email, client_phone, status,
    management_token, token_expires_at
  ) values (
    p_event_id, p_client_id, trim(p_client_name), lower(trim(p_client_email)), p_client_phone, v_status,
    v_token, v_event.start_time + interval '1 day'
  )
  returning id into v_registration_id;

  return query select v_registration_id, v_status, v_token;
end;
$$;

create or replace function public.cancel_event_registration_by_token(
  p_registration_id uuid,
  p_token text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registration public.event_registrations%rowtype;
  v_next_waitlisted public.event_registrations%rowtype;
begin
  select * into v_registration from public.event_registrations
    where id = p_registration_id and management_token = p_token
    for update;
  if not found then
    raise exception 'INVALID_TOKEN' using errcode = 'P0001';
  end if;

  update public.event_registrations set status = 'cancelled' where id = p_registration_id;

  if v_registration.status = 'confirmed' then
    select * into v_next_waitlisted from public.event_registrations
      where event_id = v_registration.event_id and status = 'waitlisted'
      order by created_at asc
      limit 1
      for update;
    if found then
      update public.event_registrations set status = 'confirmed' where id = v_next_waitlisted.id;
    end if;
  end if;

  return true;
end;
$$;

-- Allow anonymous (guest) and authenticated callers to invoke the booking
-- RPCs; the functions themselves perform every authorization/validation
-- check, and SECURITY DEFINER lets them write despite admin-only RLS above.
grant execute on function public.book_appointment to anon, authenticated;
grant execute on function public.cancel_appointment_by_token to anon, authenticated;
grant execute on function public.reschedule_appointment_by_token to anon, authenticated;
grant execute on function public.register_for_event to anon, authenticated;
grant execute on function public.cancel_event_registration_by_token to anon, authenticated;
grant execute on function public.is_within_availability to anon, authenticated;
