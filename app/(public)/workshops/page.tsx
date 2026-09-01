import type { Metadata } from 'next';
import { getBookingRepository } from '@/lib/repository';
import { Badge } from '@/components/ui/badge';
import { EventRegistrationForm } from '@/components/workshops/event-registration-form';
import { formatTimeInTimezone } from '@/lib/timezone';
import { formatPriceCents } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Workshops — Code & Combat by Abel',
  description: 'Upcoming coding seminars and beginner striking group classes.',
};

export default async function WorkshopsPage() {
  const workshops = await getBookingRepository().listUpcomingWorkshops();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-cb-bone">Workshops</h1>
      <p className="mb-12 text-cb-gray">Small-group coding seminars and beginner striking classes — limited seats.</p>

      {workshops.length === 0 ? (
        <p className="text-cb-gray">No upcoming workshops scheduled right now. Check back soon.</p>
      ) : (
        <div className="space-y-6">
          {workshops.map((workshop) => {
            const seatsRemaining = Math.max(workshop.capacity - workshop.confirmedCount, 0);
            const isFull = seatsRemaining === 0;
            return (
              <div key={workshop.id} className="card">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <h2 className="text-xl font-bold text-cb-bone">{workshop.title}</h2>
                  <Badge variant={workshop.category}>{workshop.category}</Badge>
                </div>
                <p className="mb-4 text-cb-gray">{workshop.description}</p>
                <div className="mb-4 flex flex-wrap gap-3 text-mono text-cb-gray">
                  <span>{formatTimeInTimezone(new Date(workshop.startTime), 'America/Los_Angeles', 'EEE MMM d, h:mm a zzz')}</span>
                  <span aria-hidden="true">·</span>
                  <span>{workshop.durationMinutes} min</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {formatPriceCents(workshop.priceCents)}
                    {workshop.priceUnit === 'person' ? ' / person' : ''}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{workshop.deliveryType}</span>
                </div>
                <p className="mb-4 text-sm">
                  {isFull ? (
                    <span className="text-cb-crimson">Full — join the waitlist</span>
                  ) : (
                    <span className="text-cb-electric">
                      {seatsRemaining} of {workshop.capacity} seats remaining
                    </span>
                  )}
                </p>
                <EventRegistrationForm eventId={workshop.id} isFull={isFull} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
