import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AvailabilityManager } from '@/components/admin/availability-manager';

export default async function AdminAvailabilityPage() {
  const supabase = await createServerSupabaseClient();
  const [{ data: rules }, { data: blocks }] = await Promise.all([
    supabase.from('availability_rules').select('*').order('day_of_week'),
    supabase.from('calendar_blocks').select('*').order('start_time'),
  ]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-cb-bone">Availability</h1>
        <Link href="/admin/settings" className="text-sm text-cb-gray underline hover:text-cb-bone">
          Booking policy &amp; buffer settings →
        </Link>
      </div>
      <AvailabilityManager rules={rules ?? []} blocks={blocks ?? []} />
    </div>
  );
}
