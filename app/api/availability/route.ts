import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateAvailableSlots } from '@/lib/domain/availability';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const serviceId = searchParams.get('serviceId');
  const rangeStartParam = searchParams.get('rangeStart');
  const rangeEndParam = searchParams.get('rangeEnd');

  if (!serviceId || !rangeStartParam || !rangeEndParam) {
    return NextResponse.json({ error: 'serviceId, rangeStart, and rangeEnd are required.' }, { status: 400 });
  }

  const rangeStart = new Date(rangeStartParam);
  const rangeEnd = new Date(rangeEndParam);
  if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
    return NextResponse.json({ error: 'Invalid date range.' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  const [{ data: service }, { data: settings }] = await Promise.all([
    supabase
      .from('services')
      .select('id, category, duration_minutes, buffer_minutes, max_participants, active')
      .eq('id', serviceId)
      .maybeSingle(),
    supabase.from('booking_settings').select('*').single(),
  ]);

  if (!service || !service.active) {
    return NextResponse.json({ error: 'Service not found.' }, { status: 404 });
  }
  if (!settings) {
    return NextResponse.json({ error: 'Booking is not configured yet.' }, { status: 503 });
  }

  const [{ data: rules }, { data: overrides }, { data: blocks }, { data: appointments }] = await Promise.all([
    supabase.from('availability_rules').select('day_of_week, start_time, end_time, category, active').eq('active', true),
    supabase
      .from('availability_overrides')
      .select('date, start_time, end_time, is_available')
      .gte('date', rangeStart.toISOString().slice(0, 10))
      .lte('date', rangeEnd.toISOString().slice(0, 10)),
    supabase
      .from('calendar_blocks')
      .select('start_time, end_time')
      .lte('start_time', rangeEnd.toISOString())
      .gte('end_time', rangeStart.toISOString()),
    supabase
      .from('appointments')
      .select('service_id, start_time, end_time, buffer_minutes, capacity, appointment_participants(count)')
      .in('status', ['pending', 'confirmed'])
      .lte('start_time', rangeEnd.toISOString())
      .gte('end_time', rangeStart.toISOString()),
  ]);

  const slots = generateAvailableSlots({
    serviceId: service.id,
    category: service.category,
    durationMinutes: service.duration_minutes,
    maxParticipants: service.max_participants,
    businessTimezone: settings.business_timezone,
    minNoticeHours: settings.min_notice_hours,
    bookingWindowDays: settings.booking_window_days,
    rangeStart,
    rangeEnd,
    rules: (rules ?? []).map((r) => ({
      dayOfWeek: r.day_of_week,
      startTime: r.start_time.slice(0, 5),
      endTime: r.end_time.slice(0, 5),
      category: r.category,
      active: r.active,
    })),
    overrides: (overrides ?? []).map((o) => ({
      date: o.date,
      startTime: o.start_time.slice(0, 5),
      endTime: o.end_time.slice(0, 5),
      isAvailable: o.is_available,
    })),
    blocks: (blocks ?? []).map((b) => ({ startTime: new Date(b.start_time), endTime: new Date(b.end_time) })),
    existingAppointments: (appointments ?? []).map((a) => ({
      serviceId: a.service_id,
      startTime: new Date(a.start_time),
      endTime: new Date(a.end_time),
      bufferMinutes: a.buffer_minutes,
      capacity: a.capacity,
      participantCount: (a.appointment_participants as unknown as { count: number }[])?.[0]?.count ?? 0,
    })),
  });

  // Deliberately flat and UTC — grouping by calendar date must happen in
  // the VISITOR's own timezone, not the business timezone, so that's left
  // to the client (see lib/domain/availability.ts groupSlotsByLocalDate,
  // called client-side with the visitor's detected zone).
  return NextResponse.json({
    businessTimezone: settings.business_timezone,
    slots: slots.map((s) => ({
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      capacity: s.capacity,
      remainingCapacity: s.remainingCapacity,
      isGroupSlot: s.isGroupSlot,
    })),
  });
}
