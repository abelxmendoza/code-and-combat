import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/authorization';
import { ProfileForm } from '@/components/auth/profile-form';

export default async function ProfilePage() {
  const session = await requireUser();
  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();

  return (
    <div>
      <h2 className="mb-6 text-cb-bone">Profile</h2>
      <ProfileForm
        defaultValues={{
          fullName: profile?.full_name ?? '',
          phone: profile?.phone ?? '',
          timezone: profile?.timezone ?? 'America/Los_Angeles',
        }}
      />
    </div>
  );
}
