import type { Metadata } from 'next';
import Link from 'next/link';
import { Users, PartyPopper, Layers } from 'lucide-react';
import { getBookingRepository } from '@/lib/repository';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPriceCents } from '@/lib/utils';
import { formatTimeInTimezone } from '@/lib/timezone';
import type { BookableService } from '@/types/domain';
import type { WorkshopDto } from '@/lib/repository';

export const metadata: Metadata = {
  title: 'Services — Code & Combat by Abel',
  description: 'Coding & tech tutoring and private striking training in LA/OC — private sessions, group workshops, or a four-session package.',
};

export default async function ServicesPage() {
  const repo = getBookingRepository();
  const [services, workshops] = await Promise.all([repo.listActiveServices(), repo.listUpcomingWorkshops()]);
  const codeService = services.find((s) => s.category === 'code');
  const combatService = services.find((s) => s.category === 'combat');

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-cb-bone">Services</h1>
      <p className="mb-12 max-w-2xl text-cb-gray">
        Four ways to work with Abel — kept simple on purpose. Private sessions starting at $50.
      </p>

      <div className="space-y-16">
        {codeService && <OfferSection service={codeService} accent="border-l-cb-electric" badgeVariant="code" />}
        {combatService && <OfferSection service={combatService} accent="border-l-cb-crimson" badgeVariant="combat" />}

        <section>
          <div className="mb-6 flex items-center gap-3">
            <PartyPopper className="h-6 w-6 text-cb-crimson" aria-hidden="true" />
            <h2 className="text-cb-bone">Group Workshop</h2>
          </div>
          <p className="mb-6 max-w-2xl text-cb-gray">
            A coding seminar or a beginner striking class, run in a small group — $25 per person, 90 minutes by
            default. Topic, date, capacity, and remaining seats are shown for each upcoming session.
          </p>
          {workshops.length === 0 ? (
            <p className="text-cb-gray">No workshops scheduled right now — check back soon.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {workshops.map((w) => (
                <WorkshopCard key={w.id} workshop={w} />
              ))}
            </div>
          )}
          <Button asChild variant="secondary" className="mt-6">
            <Link href="/workshops">View all workshops</Link>
          </Button>
        </section>

        <section>
          <div className="mb-6 flex items-center gap-3">
            <Layers className="h-6 w-6 text-cb-crimson" aria-hidden="true" />
            <h2 className="text-cb-bone">Four-Session Package</h2>
          </div>
          <div className="card max-w-2xl">
            <p className="mb-4 text-cb-gray">
              Four 60-minute private sessions, bundled at a lower per-session rate — choose Coding &amp; Tech
              Tutoring or Private Striking Training when you book.
            </p>
            <div className="mb-4 flex flex-wrap items-center gap-3 text-mono text-cb-gray">
              <span>4 × 60 min</span>
              <span aria-hidden="true">·</span>
              <span>{formatPriceCents(18000)} total</span>
            </div>
            <p className="mb-4 text-sm text-cb-amber">
              Payment integration is coming soon — booking a package starts a request; Abel follows up to arrange
              payment.
            </p>
            <Button asChild>
              <Link href="/booking">Get started</Link>
            </Button>
          </div>
        </section>

        <p className="max-w-2xl rounded border border-cb-amber/40 bg-cb-dark p-4 text-sm text-cb-gray">
          Martial arts sessions are beginner-focused and are not medical advice. Participation requires accepting a
          waiver, presented during booking. In-person sessions serve the LA / Orange County area.
        </p>
      </div>
    </div>
  );
}

function OfferSection({
  service,
  accent,
  badgeVariant,
}: {
  service: BookableService;
  accent: string;
  badgeVariant: 'code' | 'combat';
}) {
  return (
    <section className={`border-l-4 ${accent} pl-6`}>
      <div className="mb-3 flex items-center gap-3">
        <Users className="h-6 w-6 text-cb-bone" aria-hidden="true" />
        <h2 className="text-cb-bone">{service.name}</h2>
        <Badge variant={badgeVariant}>{badgeVariant}</Badge>
      </div>
      <p className="mb-4 max-w-2xl text-cb-gray">{service.fullDescription}</p>
      <div className="mb-4 flex flex-wrap items-center gap-3 text-mono text-cb-gray">
        <span>{service.durationMinutes} min</span>
        <span aria-hidden="true">·</span>
        <span>{formatPriceCents(service.priceCents)}</span>
        <span aria-hidden="true">·</span>
        <span>{service.deliveryType === 'hybrid' ? 'online or in person' : service.deliveryType}</span>
      </div>
      <Button asChild>
        <Link href={`/booking?service=${service.slug}`}>Book</Link>
      </Button>
    </section>
  );
}

function WorkshopCard({ workshop }: { workshop: WorkshopDto }) {
  const seatsRemaining = Math.max(workshop.capacity - workshop.confirmedCount, 0);
  return (
    <div className="card">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-bold text-cb-bone">{workshop.title}</h3>
        <Badge variant={workshop.category}>{workshop.category}</Badge>
      </div>
      <p className="text-mono text-sm text-cb-gray">
        {formatTimeInTimezone(new Date(workshop.startTime), 'America/Los_Angeles', 'MMM d, h:mm a zzz')}
      </p>
      <p className="text-mono text-sm text-cb-gray">
        {formatPriceCents(workshop.priceCents)}/person · {seatsRemaining} of {workshop.capacity} seats left
      </p>
    </div>
  );
}
