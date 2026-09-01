import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface AdminClientRow {
  email: string;
  name: string;
  phone: string | null;
  bookingCount: number;
  lastBookingAt: string;
}

export async function getAdminClients(search?: string): Promise<AdminClientRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('appointment_participants')
    .select('client_name, client_email, client_phone, appointments(start_time)');

  if (error || !data) return [];

  const byEmail = new Map<string, AdminClientRow>();
  for (const row of data) {
    const email = row.client_email;
    const appointment = row.appointments as unknown as { start_time: string } | null;
    const existing = byEmail.get(email);
    if (existing) {
      existing.bookingCount += 1;
      if (appointment && appointment.start_time > existing.lastBookingAt) existing.lastBookingAt = appointment.start_time;
    } else {
      byEmail.set(email, {
        email,
        name: row.client_name,
        phone: row.client_phone,
        bookingCount: 1,
        lastBookingAt: appointment?.start_time ?? '',
      });
    }
  }

  let clients = Array.from(byEmail.values()).sort((a, b) => b.lastBookingAt.localeCompare(a.lastBookingAt));
  if (search) {
    const term = search.toLowerCase();
    clients = clients.filter((c) => c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term));
  }
  return clients;
}

export interface ClientHistoryRow {
  bookingReference: string;
  status: string;
  startTime: string;
  serviceName: string;
}

export async function getClientBookingHistory(email: string): Promise<ClientHistoryRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('appointment_participants')
    .select('appointments(booking_reference, status, start_time, services(name))')
    .eq('client_email', email.toLowerCase());

  if (error || !data) return [];

  return data
    .map((row) => {
      const appointment = row.appointments as unknown as {
        booking_reference: string;
        status: string;
        start_time: string;
        services: { name: string } | null;
      } | null;
      if (!appointment) return null;
      return {
        bookingReference: appointment.booking_reference,
        status: appointment.status,
        startTime: appointment.start_time,
        serviceName: appointment.services?.name ?? 'Session',
      };
    })
    .filter((r): r is ClientHistoryRow => r !== null)
    .sort((a, b) => b.startTime.localeCompare(a.startTime));
}

export interface ClientNoteRow {
  id: string;
  note: string;
  createdAt: string;
}

export async function getClientNotes(email: string): Promise<ClientNoteRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('client_notes')
    .select('id, note, created_at')
    .eq('client_email', email.toLowerCase())
    .order('created_at', { ascending: false });

  return (data ?? []).map((n) => ({ id: n.id, note: n.note, createdAt: n.created_at }));
}
