import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SettingsForm } from '@/components/admin/settings-form';

export default async function AdminSettingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: settings } = await supabase.from('booking_settings').select('*').single();

  return (
    <div>
      <h1 className="mb-8 text-cb-bone">Settings</h1>
      {settings && <SettingsForm settings={settings} />}
    </div>
  );
}
