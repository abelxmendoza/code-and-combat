import 'server-only';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getNotificationAdapter, type NotificationPayload } from './adapter';
import type { Json } from '@/types/database';

/**
 * Sends (or, today, logs the intent to send) one notification and records
 * the attempt in notification_log for auditing — regardless of whether a
 * real provider is configured.
 *
 * Deliberately swallows every failure here: this runs after a booking has
 * already succeeded (or failed on its own terms), so a missing/invalid
 * SUPABASE_SERVICE_ROLE_KEY, an unreachable database, or a broken adapter
 * must never turn a successful booking into a user-facing error. Logged to
 * the server console instead so it's still visible to a developer.
 */
export async function dispatchNotification(payload: NotificationPayload): Promise<void> {
  try {
    const adapter = getNotificationAdapter(payload.channel);
    const result = await adapter.send(payload);

    const admin = createAdminSupabaseClient();
    await admin.from('notification_log').insert({
      channel: payload.channel,
      template: payload.template,
      recipient: payload.recipient,
      appointment_id: payload.appointmentId ?? null,
      event_registration_id: payload.eventRegistrationId ?? null,
      status: result.status,
      provider: result.provider,
      error_message: result.errorMessage ?? null,
      payload: payload.data as Json,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[notifications] failed to dispatch/log ${payload.channel}:${payload.template}`, err);
  }
}

export async function notifyBookingConfirmed(params: {
  clientEmail: string;
  clientName: string;
  serviceName: string;
  startTimeIso: string;
  bookingReference: string;
  appointmentId: string;
}): Promise<void> {
  await dispatchNotification({
    channel: 'email',
    template: 'booking_confirmed',
    recipient: params.clientEmail,
    appointmentId: params.appointmentId,
    data: params,
  });
}

export async function notifyBookingCancelled(params: {
  clientEmail: string;
  serviceName: string;
  startTimeIso: string;
  bookingReference: string;
  appointmentId: string;
}): Promise<void> {
  await dispatchNotification({
    channel: 'email',
    template: 'booking_cancelled',
    recipient: params.clientEmail,
    appointmentId: params.appointmentId,
    data: params,
  });
}

export async function notifyBookingRescheduled(params: {
  clientEmail: string;
  serviceName: string;
  startTimeIso: string;
  bookingReference: string;
  appointmentId: string;
}): Promise<void> {
  await dispatchNotification({
    channel: 'email',
    template: 'booking_rescheduled',
    recipient: params.clientEmail,
    appointmentId: params.appointmentId,
    data: params,
  });
}

export async function notifyEventRegistration(params: {
  clientEmail: string;
  eventTitle: string;
  startTimeIso: string;
  status: string;
  registrationId: string;
}): Promise<void> {
  await dispatchNotification({
    channel: 'email',
    template: 'event_registration',
    recipient: params.clientEmail,
    eventRegistrationId: params.registrationId,
    data: params,
  });
}
