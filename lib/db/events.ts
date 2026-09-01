import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { GroupEvent } from '@/types/domain';

export interface WorkshopListItem extends GroupEvent {
  confirmedCount: number;
}

export async function getUpcomingWorkshops(): Promise<WorkshopListItem[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('group_events')
    .select('*, event_registrations(status)')
    .eq('status', 'scheduled')
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true });

  if (error || !data) return [];

  return data.map((row) => {
    const typedRow = row as unknown as GroupEvent & { event_registrations: { status: string }[] };
    const confirmedCount = typedRow.event_registrations.filter((r) => r.status === 'confirmed').length;
    return { ...(typedRow as GroupEvent), confirmedCount };
  });
}
