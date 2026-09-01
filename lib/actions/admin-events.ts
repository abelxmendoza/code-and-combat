'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { ActionResult } from './booking';

const groupEventSchema = z.object({
  slug: z.string().trim().min(1).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only.'),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
  category: z.enum(['code', 'combat']),
  startTime: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(600),
  capacity: z.number().int().min(1).max(200),
  priceCents: z.number().int().min(0),
  priceUnit: z.enum(['session', 'person']),
  deliveryType: z.enum(['online', 'in-person', 'hybrid']),
  location: z.string().trim().max(300).optional().or(z.literal('')),
});

export async function upsertGroupEvent(input: unknown, eventId?: string): Promise<ActionResult<{ id: string }>> {
  const parsed = groupEventSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Check the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;
  const supabase = await createServerSupabaseClient();

  const row = {
    slug: data.slug,
    title: data.title,
    description: data.description,
    category: data.category,
    start_time: data.startTime,
    duration_minutes: data.durationMinutes,
    capacity: data.capacity,
    price_cents: data.priceCents,
    price_unit: data.priceUnit,
    delivery_type: data.deliveryType,
    location: data.location || null,
  };

  const query = eventId
    ? supabase.from('group_events').update(row).eq('id', eventId).select('id').single()
    : supabase.from('group_events').insert(row).select('id').single();

  const { data: result, error } = await query;
  if (error || !result) return { success: false, error: 'Could not save the workshop.' };

  revalidatePath('/admin/workshops');
  revalidatePath('/workshops');
  return { success: true, data: { id: result.id } };
}

export async function cancelGroupEvent(eventId: string): Promise<ActionResult<{ cancelled: boolean }>> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('group_events').update({ status: 'cancelled' }).eq('id', eventId);
  if (error) return { success: false, error: 'Could not cancel the workshop.' };

  revalidatePath('/admin/workshops');
  revalidatePath('/workshops');
  return { success: true, data: { cancelled: true } };
}
