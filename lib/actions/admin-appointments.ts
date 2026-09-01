'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { ActionResult } from './booking';
import type { AppointmentStatus } from '@/types/domain';

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  adminNotes?: string,
): Promise<ActionResult<{ updated: boolean }>> {
  const supabase = await createServerSupabaseClient();
  const update: { status: AppointmentStatus; admin_notes?: string } = { status };
  if (adminNotes !== undefined) update.admin_notes = adminNotes;

  const { error } = await supabase.from('appointments').update(update).eq('id', appointmentId);
  if (error) {
    return { success: false, error: 'Admins only, or the update failed. Please try again.' };
  }

  revalidatePath('/admin/appointments');
  revalidatePath('/admin/calendar');
  revalidatePath('/admin');
  return { success: true, data: { updated: true } };
}

const ADMIN_RESCHEDULE_ERRORS: Record<string, string> = {
  NOT_AUTHORIZED: 'You must be an admin to do this.',
  APPOINTMENT_NOT_FOUND: 'Appointment not found.',
  APPOINTMENT_NOT_RESCHEDULABLE: 'This appointment can’t be rescheduled.',
  SLOT_NOT_AVAILABLE: 'That time conflicts with another booking or falls outside availability.',
};

export async function adminRescheduleAppointment(
  appointmentId: string,
  newStartTime: string,
): Promise<ActionResult<{ startTime: string; endTime: string }>> {
  const supabase = await createServerSupabaseClient();
  const { data: rows, error } = await supabase.rpc('admin_reschedule_appointment', {
    p_appointment_id: appointmentId,
    p_new_start_time: newStartTime,
  });

  if (error || !rows || rows.length === 0) {
    return { success: false, error: ADMIN_RESCHEDULE_ERRORS[(error?.message ?? '').trim()] ?? 'Unable to reschedule.' };
  }

  revalidatePath('/admin/calendar');
  revalidatePath('/admin/appointments');
  return { success: true, data: { startTime: rows[0].start_time, endTime: rows[0].end_time } };
}
