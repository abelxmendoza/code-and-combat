import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface CalendarEventDto {
  id: string;
  title: string;
  start: string;
  end: string;
  status: string;
  category: 'code' | 'combat';
  clientName: string;
}

/** Fetches a generous window around "today" for the admin calendar — wide
 * enough for month/week/agenda navigation without a fetch per view change. */
export async function getCalendarAppointments(): Promise<CalendarEventDto[]> {
  const supabase = await createServerSupabaseClient();
  const rangeStart = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const rangeEnd = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('appointments')
    .select('id, status, start_time, end_time, services(name, category), appointment_participants(client_name, is_primary_contact)')
    .gte('start_time', rangeStart)
    .lte('start_time', rangeEnd)
    .neq('status', 'cancelled_by_client')
    .neq('status', 'cancelled_by_admin');

  if (error || !data) return [];

  return data.map((row) => {
    const service = row.services as unknown as { name: string; category: 'code' | 'combat' } | null;
    const participants = (row.appointment_participants as unknown as { client_name: string; is_primary_contact: boolean }[]) ?? [];
    const primary = participants.find((p) => p.is_primary_contact) ?? participants[0];
    return {
      id: row.id,
      title: `${service?.name ?? 'Session'} — ${primary?.client_name ?? 'Client'}`,
      start: row.start_time,
      end: row.end_time,
      status: row.status,
      category: service?.category ?? 'code',
      clientName: primary?.client_name ?? 'Client',
    };
  });
}
