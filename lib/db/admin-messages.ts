import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface AdminContactMessage {
  id: string;
  name: string;
  email: string;
  inquiryType: string;
  preferredContactMethod: string;
  message: string;
  status: string;
  createdAt: string;
}

export async function getContactMessages(status?: string): Promise<AdminContactMessage[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    inquiryType: row.inquiry_type,
    preferredContactMethod: row.preferred_contact_method,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function getUnreadContactMessageCount(): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const { count } = await supabase
    .from('contact_messages')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'new');
  return count ?? 0;
}
