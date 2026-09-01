import Link from 'next/link';
import { getAdminMetrics } from '@/lib/db/admin';
import { getUnreadContactMessageCount } from '@/lib/db/admin-messages';
import { formatPriceCents } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export default async function AdminDashboardPage() {
  const [metrics, unreadMessageCount] = await Promise.all([getAdminMetrics(), getUnreadContactMessageCount()]);

  return (
    <div>
      <h1 className="mb-8 text-cb-bone">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Upcoming sessions" value={metrics.upcomingSessions.toString()} />
        <MetricCard label="Completed sessions" value={metrics.completedSessions.toString()} />
        <MetricCard label="Cancellations" value={metrics.cancelledSessions.toString()} />
        <MetricCard label="No-shows" value={metrics.noShowSessions.toString()} />
        <MetricCard label="Estimated revenue" value={formatPriceCents(metrics.estimatedRevenueCents)} />
        <MetricCard label="Avg. booking value" value={formatPriceCents(metrics.averageBookingValueCents)} />
        <MetricCard label="New messages" value={unreadMessageCount.toString()} href="/admin/messages" />
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/admin/calendar" className="text-cb-bone underline hover:text-cb-electric">
          Open calendar
        </Link>
        <Link href="/admin/appointments" className="text-cb-bone underline hover:text-cb-electric">
          View all appointments
        </Link>
        <Link href="/admin/messages" className="text-cb-bone underline hover:text-cb-electric">
          View messages
        </Link>
      </div>
    </div>
  );
}

function MetricCard({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <>
      <p className="text-mono text-cb-gray">{label}</p>
      <p className="mt-2 text-3xl font-bold text-cb-bone">{value}</p>
    </>
  );
  if (href) {
    return (
      <Link href={href}>
        <Card className="transition hover:border-cb-electric">{content}</Card>
      </Link>
    );
  }
  return <Card>{content}</Card>;
}
