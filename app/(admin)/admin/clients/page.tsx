import Link from 'next/link';
import { getAdminClients } from '@/lib/db/admin-clients';
import { Button } from '@/components/ui/button';
import { formatTimeInTimezone } from '@/lib/timezone';

export default async function AdminClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const clients = await getAdminClients(q);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-cb-bone">Clients</h1>
        <Button asChild variant="secondary" size="sm">
          <a href="/api/admin/export/clients">Export CSV</a>
        </Button>
      </div>

      <form action="/admin/clients" className="mb-6 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name or email"
          className="input-field w-full max-w-sm"
        />
        <Button type="submit" size="sm" variant="secondary">
          Search
        </Button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-cb-steel text-left text-mono text-cb-gray">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Bookings</th>
              <th className="px-3 py-2">Last booking</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.email} className="border-b border-cb-dark">
                <td className="px-3 py-3 text-cb-bone">
                  <Link href={`/admin/clients/${encodeURIComponent(client.email)}`} className="hover:text-cb-electric">
                    {client.name}
                  </Link>
                </td>
                <td className="px-3 py-3 text-cb-gray">{client.email}</td>
                <td className="px-3 py-3 text-cb-gray">{client.bookingCount}</td>
                <td className="px-3 py-3 text-cb-gray">
                  {client.lastBookingAt ? formatTimeInTimezone(new Date(client.lastBookingAt), 'America/Los_Angeles', 'MMM d, yyyy') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && <p className="mt-6 text-cb-gray">No clients found.</p>}
      </div>
    </div>
  );
}
