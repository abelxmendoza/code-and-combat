'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { availabilityRuleSchema, calendarBlockSchema } from '@/lib/validation';
import type { ActionResult } from './booking';

function revalidateAvailability() {
  revalidatePath('/admin/availability');
  revalidatePath('/booking');
}

export async function upsertAvailabilityRule(input: unknown, ruleId?: string): Promise<ActionResult<{ id: string }>> {
  const parsed = availabilityRuleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Check the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;
  const supabase = await createServerSupabaseClient();

  const row = {
    day_of_week: data.dayOfWeek,
    start_time: data.startTime,
    end_time: data.endTime,
    category: data.category,
    active: data.active,
  };

  const query = ruleId
    ? supabase.from('availability_rules').update(row).eq('id', ruleId).select('id').single()
    : supabase.from('availability_rules').insert(row).select('id').single();

  const { data: result, error } = await query;
  if (error || !result) return { success: false, error: 'Could not save the availability rule.' };

  revalidateAvailability();
  return { success: true, data: { id: result.id } };
}

export async function deleteAvailabilityRule(ruleId: string): Promise<ActionResult<{ deleted: boolean }>> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('availability_rules').delete().eq('id', ruleId);
  if (error) return { success: false, error: 'Could not delete the rule.' };

  revalidateAvailability();
  return { success: true, data: { deleted: true } };
}

export async function createCalendarBlock(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = calendarBlockSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Check the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const supabase = await createServerSupabaseClient();
  const { data: result, error } = await supabase
    .from('calendar_blocks')
    .insert({ start_time: parsed.data.startTime, end_time: parsed.data.endTime, reason: parsed.data.reason })
    .select('id')
    .single();

  if (error || !result) return { success: false, error: 'Could not create the block.' };

  revalidateAvailability();
  return { success: true, data: { id: result.id } };
}

export async function deleteCalendarBlock(blockId: string): Promise<ActionResult<{ deleted: boolean }>> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('calendar_blocks').delete().eq('id', blockId);
  if (error) return { success: false, error: 'Could not delete the block.' };

  revalidateAvailability();
  return { success: true, data: { deleted: true } };
}

export async function updateBookingSettings(input: {
  minNoticeHours: number;
  bookingWindowDays: number;
  cancellationNoticeHours: number;
  rescheduleNoticeHours: number;
}): Promise<ActionResult<{ updated: boolean }>> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('booking_settings')
    .update({
      min_notice_hours: input.minNoticeHours,
      booking_window_days: input.bookingWindowDays,
      cancellation_notice_hours: input.cancellationNoticeHours,
      reschedule_notice_hours: input.rescheduleNoticeHours,
    })
    .eq('id', true);

  if (error) return { success: false, error: 'Could not update settings.' };

  revalidatePath('/admin/settings');
  revalidateAvailability();
  return { success: true, data: { updated: true } };
}
