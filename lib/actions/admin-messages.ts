'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { ActionResult } from './booking';

export async function updateContactMessageStatus(
  messageId: string,
  status: 'new' | 'read' | 'archived',
): Promise<ActionResult<{ updated: boolean }>> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('contact_messages').update({ status }).eq('id', messageId);
  if (error) return { success: false, error: 'Could not update this message.' };

  revalidatePath('/admin/messages');
  return { success: true, data: { updated: true } };
}
