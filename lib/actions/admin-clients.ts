'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { ActionResult } from './booking';

export async function addClientNote(clientEmail: string, note: string): Promise<ActionResult<{ id: string }>> {
  if (!note.trim()) {
    return { success: false, error: 'Note can’t be empty.' };
  }
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: result, error } = await supabase
    .from('client_notes')
    .insert({ client_email: clientEmail.toLowerCase().trim(), note: note.trim(), created_by: user?.id ?? null })
    .select('id')
    .single();

  if (error || !result) return { success: false, error: 'Could not save the note.' };

  revalidatePath('/admin/clients');
  return { success: true, data: { id: result.id } };
}
