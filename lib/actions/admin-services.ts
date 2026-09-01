'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { serviceSchema } from '@/lib/validation';
import type { ActionResult } from './booking';

export async function upsertService(input: unknown, serviceId?: string): Promise<ActionResult<{ id: string }>> {
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Check the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;
  const supabase = await createServerSupabaseClient();

  const row = {
    slug: data.slug,
    name: data.name,
    short_description: data.shortDescription,
    full_description: data.fullDescription,
    category: data.category,
    duration_minutes: data.durationMinutes,
    buffer_minutes: data.bufferMinutes,
    price_cents: data.priceCents,
    price_unit: data.priceUnit,
    delivery_type: data.deliveryType,
    max_participants: data.maxParticipants,
    image_url: data.imageUrl || null,
    preparation_instructions: data.preparationInstructions || null,
    requires_waiver: data.requiresWaiver,
    active: data.active,
  };

  const query = serviceId
    ? supabase.from('services').update(row).eq('id', serviceId).select('id').single()
    : supabase.from('services').insert(row).select('id').single();

  const { data: result, error } = await query;
  if (error || !result) {
    return { success: false, error: error?.message.includes('duplicate') ? 'That slug is already in use.' : 'Could not save the service.' };
  }

  revalidatePath('/admin/services');
  revalidatePath('/services');
  revalidatePath('/booking');
  return { success: true, data: { id: result.id } };
}

export async function toggleServiceActive(serviceId: string, active: boolean): Promise<ActionResult<{ updated: boolean }>> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('services').update({ active }).eq('id', serviceId);
  if (error) return { success: false, error: 'Could not update the service.' };

  revalidatePath('/admin/services');
  revalidatePath('/services');
  return { success: true, data: { updated: true } };
}

export async function softDeleteService(serviceId: string): Promise<ActionResult<{ deleted: boolean }>> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('services')
    .update({ active: false, deleted_at: new Date().toISOString() })
    .eq('id', serviceId);
  if (error) return { success: false, error: 'Could not delete the service.' };

  revalidatePath('/admin/services');
  revalidatePath('/services');
  return { success: true, data: { deleted: true } };
}
