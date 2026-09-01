import { requireAdmin } from '@/lib/auth/authorization';
import { AdminShell } from '@/components/admin/admin-shell';
import { getUnreadContactMessageCount } from '@/lib/db/admin-messages';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const unreadMessageCount = await getUnreadContactMessageCount();
  return <AdminShell unreadMessageCount={unreadMessageCount}>{children}</AdminShell>;
}
