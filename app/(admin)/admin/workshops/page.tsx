import { createServerSupabaseClient } from '@/lib/supabase/server';
import { WorkshopsManager } from '@/components/admin/workshops-manager';

export default async function AdminWorkshopsPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('group_events')
    .select('*, event_registrations(status)')
    .order('start_time', { ascending: false });

  const events = (data ?? []).map((row) => {
    const registrations = (row as unknown as { event_registrations: { status: string }[] }).event_registrations ?? [];
    const registeredCount = registrations.filter((r) => r.status === 'confirmed').length;
    return { ...row, registeredCount };
  });

  return (
    <div>
      <h1 className="mb-8 text-cb-bone">Workshops</h1>
      <WorkshopsManager events={events} />
    </div>
  );
}
