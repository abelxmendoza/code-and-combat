'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { eventRegistrationSchema } from '@/lib/validation';
import { notifyEventRegistration } from '@/lib/notifications/notify';
import type { ActionResult } from './booking';

export interface EventRegistrationConfirmation {
  registrationId: string;
  status: string;
  managementToken: string;
}

export interface ManageableEventRegistration {
  id: string;
  status: string;
  clientName: string;
  eventTitle: string;
  eventStartTime: string;
  eventCategory: string;
}

/**
 * Looks up an event registration for the public /manage/event/[id] page.
 * Same pattern as getManageableAppointment: guests have no session, so this
 * uses the admin client and manually checks the token as the authorization
 * boundary instead of relying on RLS.
 */
export async function getManageableEventRegistration(
  registrationId: string,
  token: string,
): Promise<ActionResult<ManageableEventRegistration>> {
  if (!registrationId || !token || token.length !== 64) {
    return { success: false, error: 'This management link is invalid.' };
  }

  let admin;
  try {
    admin = createAdminSupabaseClient();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[events] admin Supabase client unavailable:', err);
    return { success: false, error: 'Registration management is temporarily unavailable. Please try again shortly.' };
  }

  const { data: registration, error: lookupError } = await admin
    .from('event_registrations')
    .select('id, status, client_name, management_token, token_expires_at, group_events(title, start_time, category)')
    .eq('id', registrationId)
    .maybeSingle();

  if (lookupError) {
    return { success: false, error: 'Registration management is temporarily unavailable. Please try again shortly.' };
  }
  if (
    !registration ||
    registration.management_token !== token ||
    new Date(registration.token_expires_at) < new Date()
  ) {
    return { success: false, error: 'This management link is invalid or has expired.' };
  }

  const event = registration.group_events as unknown as { title: string; start_time: string; category: string } | null;

  return {
    success: true,
    data: {
      id: registration.id,
      status: registration.status,
      clientName: registration.client_name,
      eventTitle: event?.title ?? 'Workshop',
      eventStartTime: event?.start_time ?? '',
      eventCategory: event?.category ?? 'code',
    },
  };
}

const EVENT_ERROR_MESSAGES: Record<string, string> = {
  EVENT_NOT_FOUND: 'That workshop is no longer available.',
  EVENT_ALREADY_STARTED: 'Registration for this workshop has closed.',
  ALREADY_REGISTERED: 'You’re already registered for this workshop.',
};

export async function registerForEvent(input: unknown): Promise<ActionResult<EventRegistrationConfirmation>> {
  const parsed = eventRegistrationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Check the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rows, error } = await supabase.rpc('register_for_event', {
    p_event_id: data.eventId,
    p_client_name: data.clientName,
    p_client_email: data.clientEmail,
    p_client_phone: data.clientPhone || null,
    p_client_id: user?.id ?? null,
  });

  if (error || !rows || rows.length === 0) {
    return { success: false, error: EVENT_ERROR_MESSAGES[(error?.message ?? '').trim()] ?? 'Unable to register for this workshop.' };
  }

  const { data: event } = await supabase.from('group_events').select('title, start_time').eq('id', data.eventId).single();

  await notifyEventRegistration({
    clientEmail: data.clientEmail,
    eventTitle: event?.title ?? 'the workshop',
    startTimeIso: event?.start_time ?? '',
    status: rows[0].status,
    registrationId: rows[0].registration_id,
  });

  revalidatePath('/workshops');

  return {
    success: true,
    data: {
      registrationId: rows[0].registration_id,
      status: rows[0].status,
      managementToken: rows[0].management_token,
    },
  };
}

export async function cancelEventRegistration(
  registrationId: string,
  token: string,
): Promise<ActionResult<{ cancelled: boolean }>> {
  if (!registrationId || !token) {
    return { success: false, error: 'Invalid request.' };
  }

  const supabase = await createServerSupabaseClient();
  const { data: ok, error } = await supabase.rpc('cancel_event_registration_by_token', {
    p_registration_id: registrationId,
    p_token: token,
  });

  if (error || !ok) {
    return { success: false, error: 'Unable to cancel this registration. The link may be invalid.' };
  }

  revalidatePath('/workshops');
  return { success: true, data: { cancelled: true } };
}
