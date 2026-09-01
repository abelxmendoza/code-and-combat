import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ServicesManager } from '@/components/admin/services-manager';

export default async function AdminServicesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: services } = await supabase.from('services').select('*').is('deleted_at', null).order('sort_order');

  return (
    <div>
      <h1 className="mb-8 text-cb-bone">Services</h1>
      <ServicesManager services={services ?? []} />
    </div>
  );
}
