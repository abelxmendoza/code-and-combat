import Link from 'next/link';
import { getAdminAppointments } from '@/lib/db/admin-appointments';
import type { AppointmentStatus } from '@/types/domain';

const VALID_STATUSES: AppointmentStatus[] = [
  'pending',
  'confirmed',
  'completed',
  'cancelled_by_client',
  'cancelled_by_admin',
  'no_show',
];
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppointmentRowActions } from '@/components/admin/appointment-row-actions';
import { formatTimeInTimezone } from '@/lib/timezone';
import { formatPriceCents } from '@/lib/utils';

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; delivery?: string }>;
}) {
  const params = await searchParams;
  const appointments = await getAdminAppointments({
    status: VALID_STATUSES.includes(params.status as AppointmentStatus) ? (params.status as AppointmentStatus) : undefined,
    category: params.category === 'code' || params.category === 'combat' ? params.category : undefined,
    delivery: params.delivery as 'online' | 'in-person' | 'hybrid' | undefined,
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-cb-bone">Appointments</h1>
        <Button asChild variant="secondary" size="sm">
          <a href="/api/admin/export/appointments">Export CSV</a>
        </Button>
      </div>

      <FilterBar current={params} />

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-cb-steel text-left text-mono text-cb-gray">
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Service</th>
              <th className="px-3 py-2">Client</th>
              <th className="px-3 py-2">Delivery</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Status / Notes</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt.id} className="border-b border-cb-dark align-top">
                <td className="px-3 py-3 text-mono text-cb-bone">
                  {formatTimeInTimezone(new Date(appt.startTime), 'America/Los_Angeles', 'MMM d, h:mm a')}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-cb-bone">{appt.serviceName}</span>
                    <Badge variant={appt.serviceCategory}>{appt.serviceCategory}</Badge>
                  </div>
                  <p className="text-mono text-xs text-cb-gray">{appt.bookingReference}</p>
                </td>
                <td className="px-3 py-3">
                  <p className="text-cb-bone">{appt.primaryClientName}</p>
                  <p className="text-xs text-cb-gray">{appt.primaryClientEmail}</p>
                  {appt.participantCount > 1 && <p className="text-xs text-cb-gray">+{appt.participantCount - 1} more</p>}
                </td>
                <td className="px-3 py-3 text-cb-gray">{appt.deliveryType}</td>
                <td className="px-3 py-3 text-cb-gray">
                  {formatPriceCents(appt.priceCents)}
                  {appt.priceUnit === 'person' ? '/person' : ''}
                </td>
                <td className="px-3 py-3">
                  <AppointmentRowActions appointmentId={appt.id} status={appt.status} adminNotes={appt.adminNotes} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {appointments.length === 0 && <p className="mt-6 text-cb-gray">No appointments match these filters.</p>}
      </div>
    </div>
  );
}

function FilterBar({ current }: { current: { status?: string; category?: string; delivery?: string } }) {
  const statuses = ['pending', 'confirmed', 'completed', 'cancelled_by_client', 'cancelled_by_admin', 'no_show'];
  return (
    <form className="flex flex-wrap items-end gap-4" action="/admin/appointments">
      <div>
        <label className="label-text" htmlFor="status">
          Status
        </label>
        <select id="status" name="status" defaultValue={current.status ?? ''} className="input-field">
          <option value="">All</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label-text" htmlFor="category">
          Category
        </label>
        <select id="category" name="category" defaultValue={current.category ?? ''} className="input-field">
          <option value="">All</option>
          <option value="code">Code</option>
          <option value="combat">Combat</option>
        </select>
      </div>
      <div>
        <label className="label-text" htmlFor="delivery">
          Delivery
        </label>
        <select id="delivery" name="delivery" defaultValue={current.delivery ?? ''} className="input-field">
          <option value="">All</option>
          <option value="online">Online</option>
          <option value="in-person">In-person</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>
      <Button type="submit" size="sm" variant="secondary">
        Apply filters
      </Button>
      {(current.status || current.category || current.delivery) && (
        <Link href="/admin/appointments" className="text-sm text-cb-gray underline hover:text-cb-bone">
          Clear
        </Link>
      )}
    </form>
  );
}
