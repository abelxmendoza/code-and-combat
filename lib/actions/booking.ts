'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { bookingSchema, rescheduleSchema, cancelSchema } from '@/lib/validation';
import { notifyBookingCancelled, notifyBookingConfirmed, notifyBookingRescheduled } from '@/lib/notifications/notify';

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

// Maps the machine-readable errcodes raised by book_appointment() (see
// supabase/migrations/0008_functions.sql) to friendly copy — the server
// error message itself is never exposed as raw SQL to the visitor.
const BOOKING_ERROR_MESSAGES: Record<string, string> = {
  SERVICE_NOT_FOUND: 'That service is no longer available.',
  INVALID_CLIENT_NAME: 'Enter your full name.',
  INVALID_CLIENT_EMAIL: 'Enter a valid email address.',
  INVALID_DELIVERY_TYPE: 'That delivery method isn’t offered for this service.',
  WAIVER_REQUIRED: 'This session requires accepting the waiver before booking.',
  OUTSIDE_NOTICE_WINDOW: 'That time is too soon — pick a later slot.',
  OUTSIDE_BOOKING_WINDOW: 'That date is too far out to book yet.',
  SLOT_NOT_AVAILABLE: 'That slot was just taken or isn’t available. Pick another time.',
  SESSION_FULL: 'That group session just filled up. Pick another time.',
  ALREADY_BOOKED: 'You’re already booked into that session.',
};

function friendlyBookingError(rawMessage: string): string {
  const code = rawMessage.trim();
  return BOOKING_ERROR_MESSAGES[code] ?? 'Something went wrong while booking. Please try again.';
}

/**
 * createAdminSupabaseClient() throws synchronously when
 * SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL aren't configured —
 * a very plausible partial-setup state during development. Callers here
 * treat that (and any downstream network failure) as "no admin data
 * available" rather than letting it crash the request.
 */
function tryCreateAdminClient(): ReturnType<typeof createAdminSupabaseClient> | null {
  try {
    return createAdminSupabaseClient();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[booking] admin Supabase client unavailable:', err);
    return null;
  }
}

export interface ManageableAppointment {
  id: string;
  bookingReference: string;
  status: string;
  startTime: string;
  endTime: string;
  deliveryType: string;
  location: string | null;
  notes: string | null;
  priceCents: number;
  priceUnit: string;
  serviceId: string;
  serviceName: string;
  serviceCategory: string;
  isGroupSession: boolean;
  clientEmail: string;
  clientName: string;
}

/**
 * Looks up an appointment for the public /manage/[id] page. Guests have no
 * session, so RLS would hide the row entirely — this uses the admin client
 * and manually re-implements the same check RLS would otherwise do
 * (matching, unexpired token) as the authorization boundary instead.
 */
export async function getManageableAppointment(
  appointmentId: string,
  token: string,
): Promise<ActionResult<ManageableAppointment>> {
  if (!appointmentId || !token || token.length !== 64) {
    return { success: false, error: 'This management link is invalid.' };
  }

  const admin = tryCreateAdminClient();
  if (!admin) {
    return { success: false, error: 'Booking management is temporarily unavailable. Please try again shortly.' };
  }

  const { data: appointment, error: lookupError } = await admin
    .from('appointments')
    .select(
      'id, booking_reference, status, start_time, end_time, delivery_type, location, notes, price_cents, price_unit, capacity, management_token, token_expires_at, service_id, services(name, category), appointment_participants(client_name, client_email, is_primary_contact)',
    )
    .eq('id', appointmentId)
    .maybeSingle();

  if (lookupError) {
    return { success: false, error: 'Booking management is temporarily unavailable. Please try again shortly.' };
  }
  if (!appointment || appointment.management_token !== token || new Date(appointment.token_expires_at) < new Date()) {
    return { success: false, error: 'This management link is invalid or has expired.' };
  }

  const participants = appointment.appointment_participants as unknown as {
    client_name: string;
    client_email: string;
    is_primary_contact: boolean;
  }[];
  const primary = participants.find((p) => p.is_primary_contact) ?? participants[0];
  const service = appointment.services as unknown as { name: string; category: string } | null;

  return {
    success: true,
    data: {
      id: appointment.id,
      bookingReference: appointment.booking_reference,
      status: appointment.status,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      deliveryType: appointment.delivery_type,
      location: appointment.location,
      notes: appointment.notes,
      priceCents: appointment.price_cents,
      priceUnit: appointment.price_unit,
      serviceId: appointment.service_id,
      serviceName: service?.name ?? 'Session',
      serviceCategory: service?.category ?? 'code',
      isGroupSession: appointment.capacity > 1,
      clientEmail: primary?.client_email ?? '',
      clientName: primary?.client_name ?? '',
    },
  };
}

export interface BookingConfirmation {
  appointmentId: string;
  bookingReference: string;
  managementToken: string;
  startTime: string;
  endTime: string;
  priceCents: number;
  priceUnit: string;
  location: string | null;
}

export async function submitBooking(input: unknown): Promise<ActionResult<BookingConfirmation>> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Check the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rows, error } = await supabase.rpc('book_appointment', {
    p_service_id: data.serviceId,
    p_start_time: data.startTime,
    p_delivery_type: data.deliveryType,
    p_client_name: data.clientName,
    p_client_email: data.clientEmail,
    p_client_phone: data.clientPhone || null,
    p_notes: data.notes || null,
    p_client_timezone: data.timezone,
    p_waiver_accepted: data.waiverAccepted,
    p_client_id: user?.id ?? null,
  });

  if (error || !rows || rows.length === 0) {
    return { success: false, error: friendlyBookingError(error?.message ?? '') };
  }

  const result = rows[0];

  const { data: service } = await supabase
    .from('services')
    .select('name')
    .eq('id', data.serviceId)
    .single();

  await notifyBookingConfirmed({
    clientEmail: data.clientEmail,
    clientName: data.clientName,
    serviceName: service?.name ?? 'your session',
    startTimeIso: result.start_time,
    bookingReference: result.booking_reference,
    appointmentId: result.appointment_id,
  });

  revalidatePath('/booking');

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

export async function cancelBookingByToken(input: unknown): Promise<ActionResult<{ cancelled: boolean }>> {
  const parsed = cancelSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid cancellation request.' };
  }
  const { appointmentId, token, clientEmail } = parsed.data;

  const supabase = await createServerSupabaseClient();

  // Reads here use the admin (service-role) client on purpose: guests have
  // no session, so RLS would otherwise hide the row. The RPC call below is
  // the actual authorization boundary — it independently re-validates the
  // token before mutating anything. This lookup only feeds the
  // confirmation notification, so its failure (including the admin client
  // being unconfigured) must never block the actual cancellation below.
  const admin = tryCreateAdminClient();
  const { data: appointment } = admin
    ? await admin.from('appointments').select('booking_reference, start_time, services(name)').eq('id', appointmentId).maybeSingle()
    : { data: null };

  const { data: ok, error } = await supabase.rpc('cancel_appointment_by_token', {
    p_appointment_id: appointmentId,
    p_token: token,
    p_client_email: clientEmail,
  });

  if (error || !ok) {
    return { success: false, error: friendlyCancelError(error?.message ?? '') };
  }

  if (appointment) {
    const serviceName = (appointment as unknown as { services: { name: string } | null }).services?.name ?? 'your session';
    await notifyBookingCancelled({
      clientEmail,
      serviceName,
      startTimeIso: appointment.start_time,
      bookingReference: appointment.booking_reference,
      appointmentId,
    });
  }

  revalidatePath(`/manage/${appointmentId}`);

  return { success: true, data: { cancelled: true } };
}

export async function rescheduleBookingByToken(
  input: unknown,
): Promise<ActionResult<{ startTime: string; endTime: string }>> {
  const parsed = rescheduleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid reschedule request.' };
  }
  const { appointmentId, token, newStartTime } = parsed.data;

  const supabase = await createServerSupabaseClient();

  const { data: rows, error } = await supabase.rpc('reschedule_appointment_by_token', {
    p_appointment_id: appointmentId,
    p_token: token,
    p_new_start_time: newStartTime,
  });

  if (error || !rows || rows.length === 0) {
    return { success: false, error: friendlyRescheduleError(error?.message ?? '') };
  }

  // Same rationale as cancelBookingByToken: this only feeds the reschedule
  // notification, never the reschedule itself (already committed above).
  const admin = tryCreateAdminClient();
  const { data: appointment } = admin
    ? await admin
        .from('appointments')
        .select('booking_reference, services(name), appointment_participants(client_email, is_primary_contact)')
        .eq('id', appointmentId)
        .maybeSingle()
    : { data: null };

  if (appointment) {
    const primaryContact = (
      appointment as unknown as { appointment_participants: { client_email: string; is_primary_contact: boolean }[] }
    ).appointment_participants?.find((p) => p.is_primary_contact);
    const serviceName = (appointment as unknown as { services: { name: string } | null }).services?.name ?? 'your session';

    if (primaryContact) {
      await notifyBookingRescheduled({
        clientEmail: primaryContact.client_email,
        serviceName,
        startTimeIso: rows[0].start_time,
        bookingReference: appointment.booking_reference,
        appointmentId,
      });
    }
  }

  revalidatePath(`/manage/${appointmentId}`);

  return { success: true, data: { startTime: rows[0].start_time, endTime: rows[0].end_time } };
}

function friendlyCancelError(rawMessage: string): string {
  const messages: Record<string, string> = {
    INVALID_OR_EXPIRED_TOKEN: 'This management link is invalid or has expired.',
    APPOINTMENT_NOT_CANCELLABLE: 'This booking can no longer be cancelled.',
    OUTSIDE_CANCELLATION_WINDOW: 'This booking is too close to its start time to cancel online — please contact us directly.',
  };
  return messages[rawMessage.trim()] ?? 'Unable to cancel this booking. Please try again.';
}

function friendlyRescheduleError(rawMessage: string): string {
  const messages: Record<string, string> = {
    INVALID_OR_EXPIRED_TOKEN: 'This management link is invalid or has expired.',
    APPOINTMENT_NOT_RESCHEDULABLE: 'This booking can no longer be rescheduled.',
    GROUP_SESSIONS_NOT_RESCHEDULABLE: 'Group sessions can’t be rescheduled online — please contact us directly.',
    OUTSIDE_RESCHEDULE_WINDOW: 'This booking is too close to its start time to reschedule online — please contact us directly.',
    OUTSIDE_NOTICE_WINDOW: 'That new time is too soon — pick a later slot.',
    SLOT_NOT_AVAILABLE: 'That slot isn’t available. Pick another time.',
  };
  return messages[rawMessage.trim()] ?? 'Unable to reschedule this booking. Please try again.';
}
