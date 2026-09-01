import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateAvailableSlots } from '@/lib/domain/availability';
import { getActiveServices, getServiceBySlug } from '@/lib/db/services';
import type { BookableService, AvailableSlotDto } from '@/types/domain';
import type {
  BookingRepository,
  BookingConfirmationDto,
  BookingSettingsDto,
  CreateBookingInput,
  CreatePackagePurchaseInput,
  CreateWorkshopRegistrationInput,
  EventRegistrationConfirmationDto,
  PackagePurchaseConfirmationDto,
  RepoResult,
  WorkshopDto,
} from './types';

export class SupabaseBookingRepository implements BookingRepository {
  async listActiveServices(): Promise<BookableService[]> {
    return getActiveServices();
  }

  async getServiceBySlug(slug: string): Promise<BookableService | null> {
    return getServiceBySlug(slug);
  }

  async listUpcomingWorkshops(): Promise<WorkshopDto[]> {
    const supabase = await createServerSupabaseClient();
    // RLS on event_registrations ("admin or self") means a guest's request
    // can't see other people's registration rows at all — an embedded join
    // would silently come back empty and always read as "0 confirmed". This
    // RPC computes the count with elevated privilege instead, without
    // exposing the underlying rows. See 0013_workshop_seat_counts.sql.
    const { data, error } = await supabase.rpc('list_upcoming_workshops');

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      category: row.category,
      startTime: row.start_time,
      durationMinutes: row.duration_minutes,
      capacity: row.capacity,
      priceCents: row.price_cents,
      priceUnit: row.price_unit,
      deliveryType: row.delivery_type,
      location: row.location,
      status: row.status,
      confirmedCount: row.confirmed_count,
    }));
  }

  async getBookingSettings(): Promise<BookingSettingsDto> {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.from('booking_settings').select('*').single();
    return {
      businessTimezone: data?.business_timezone ?? 'America/Los_Angeles',
      minNoticeHours: data?.min_notice_hours ?? 12,
      bookingWindowDays: data?.booking_window_days ?? 45,
      cancellationNoticeHours: data?.cancellation_notice_hours ?? 24,
      rescheduleNoticeHours: data?.reschedule_notice_hours ?? 24,
    };
  }

  async getAvailableSlots({
    serviceId,
    rangeStart,
    rangeEnd,
  }: {
    serviceId: string;
    rangeStart: Date;
    rangeEnd: Date;
  }): Promise<AvailableSlotDto[]> {
    const supabase = await createServerSupabaseClient();

    const [{ data: service }, { data: settings }] = await Promise.all([
      supabase
        .from('services')
        .select('id, category, duration_minutes, buffer_minutes, max_participants, active')
        .eq('id', serviceId)
        .maybeSingle(),
      supabase.from('booking_settings').select('*').single(),
    ]);

    if (!service || !service.active || !settings) return [];

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

    return generateAvailableSlots({
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
    }).map((s) => ({
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      capacity: s.capacity,
      remainingCapacity: s.remainingCapacity,
      isGroupSlot: s.isGroupSlot,
    }));
  }

  async createBooking(input: CreateBookingInput): Promise<RepoResult<BookingConfirmationDto>> {
    const supabase = await createServerSupabaseClient();
    const { data: rows, error } = await supabase.rpc('book_appointment', {
      p_service_id: input.serviceId,
      p_start_time: input.startTimeIso,
      p_delivery_type: input.deliveryType,
      p_client_name: input.clientName,
      p_client_email: input.clientEmail,
      p_client_phone: input.clientPhone || null,
      p_notes: input.notes || null,
      p_client_timezone: input.timezone,
      p_waiver_accepted: input.waiverAccepted,
      p_client_id: input.clientId ?? null,
    });

    if (error || !rows || rows.length === 0) {
      return { success: false, errorCode: (error?.message ?? '').trim() || 'UNKNOWN_ERROR' };
    }

    const result = rows[0];
    return {
      success: true,
      data: {
        appointmentId: result.appointment_id,
        bookingReference: result.booking_reference,
        managementToken: result.management_token,
        startTime: result.start_time,
        endTime: result.end_time,
        priceCents: result.price_cents,
        priceUnit: result.price_unit,
        location: result.location,
      },
    };
  }

  async createWorkshopRegistration(
    input: CreateWorkshopRegistrationInput,
  ): Promise<RepoResult<EventRegistrationConfirmationDto>> {
    const supabase = await createServerSupabaseClient();
    const { data: rows, error } = await supabase.rpc('register_for_event', {
      p_event_id: input.eventId,
      p_client_name: input.clientName,
      p_client_email: input.clientEmail,
      p_client_phone: input.clientPhone || null,
      p_client_id: input.clientId ?? null,
    });

    if (error || !rows || rows.length === 0) {
      return { success: false, errorCode: (error?.message ?? '').trim() || 'UNKNOWN_ERROR' };
    }

    const result = rows[0];
    return {
      success: true,
      // register_for_event() only ever returns 'confirmed' or 'waitlisted'
      // for a brand-new registration (never 'cancelled').
      data: {
        registrationId: result.registration_id,
        status: result.status as 'confirmed' | 'waitlisted',
        managementToken: result.management_token,
      },
    };
  }

  async createPackagePurchase(input: CreatePackagePurchaseInput): Promise<RepoResult<PackagePurchaseConfirmationDto>> {
    const supabase = await createServerSupabaseClient();
    const { data: rows, error } = await supabase.rpc('purchase_session_package', {
      p_package_type: input.packageType,
      p_client_name: input.clientName,
      p_client_email: input.clientEmail,
      p_client_phone: input.clientPhone || null,
      p_notes: input.notes || null,
    });

    if (error || !rows || rows.length === 0) {
      return { success: false, errorCode: (error?.message ?? '').trim() || 'UNKNOWN_ERROR' };
    }

    const result = rows[0];
    return {
      success: true,
      data: {
        packageId: result.package_id,
        packageReference: result.package_reference,
        managementToken: result.management_token,
        totalSessions: result.total_sessions,
        priceCents: result.price_cents,
        status: result.status,
      },
    };
  }
}
