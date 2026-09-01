'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { profileSchema } from '@/lib/validation';
import type { ActionResult } from './booking';

export async function updateProfile(input: unknown): Promise<ActionResult<{ updated: boolean }>> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Check the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'You must be signed in.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.fullName || null,
      phone: parsed.data.phone || null,
      timezone: parsed.data.timezone,
    })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: 'Could not update your profile. Please try again.' };
  }

  revalidatePath('/portal/profile');
  return { success: true, data: { updated: true } };
}
