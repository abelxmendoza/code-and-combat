import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getMyBookings, type ClientBookingRow } from '@/lib/db/client-portal';
import { formatTimeInTimezone } from '@/lib/timezone';
import { formatPriceCents } from '@/lib/utils';

export default async function PortalPage() {
  const { upcoming, past } = await getMyBookings();

  return (
    <div className="space-y-12">
      <section>
        <h2 className="mb-6 text-cb-bone">Upcoming</h2>
        {upcoming.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {upcoming.map((booking) => (
              <BookingRow key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-6 text-cb-bone">Past</h2>
        {past.length === 0 ? (
          <p className="text-cb-gray">No past bookings yet.</p>
        ) : (
          <div className="space-y-4">
            {past.map((booking) => (
              <BookingRow key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card">
      <p className="mb-4 text-cb-gray">
        No upcoming bookings yet. Bookings made while signed in appear here automatically — a guest booking can
        still be managed anytime with the link from its confirmation email.
      </p>
      <Button asChild>
        <Link href="/booking">Book a session</Link>
      </Button>
    </div>
  );
}

function BookingRow({ booking }: { booking: ClientBookingRow }) {
  return (
    <div className="card flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <h3 className="font-bold text-cb-bone">{booking.serviceName}</h3>
          <Badge variant={booking.status === 'confirmed' ? 'success' : booking.status.startsWith('cancelled') ? 'danger' : 'neutral'}>
            {booking.status.replace(/_/g, ' ')}
          </Badge>
        </div>
        <p className="text-mono text-sm text-cb-gray">
          {formatTimeInTimezone(new Date(booking.startTime), 'America/Los_Angeles', 'EEE MMM d, h:mm a zzz')} ·{' '}
          {formatPriceCents(booking.priceCents)}
        </p>
      </div>
      <Button asChild variant="secondary" size="sm">
        <Link href={`/manage/${booking.id}?token=${booking.managementToken}`}>Manage</Link>
      </Button>
    </div>
  );
}
