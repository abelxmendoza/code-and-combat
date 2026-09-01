import Link from 'next/link';
import { Code2, Swords, CalendarCheck, MessageSquare, ClipboardCheck, PartyPopper, Users, Layers } from 'lucide-react';
import { getBookingRepository } from '@/lib/repository';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPriceCents } from '@/lib/utils';
import { formatTimeInTimezone } from '@/lib/timezone';
import type { BookableService } from '@/types/domain';

export default async function Home() {
  const repo = getBookingRepository();
  const [services, allWorkshops] = await Promise.all([repo.listActiveServices(), repo.listUpcomingWorkshops()]);
  const codeService = services.find((s) => s.category === 'code');
  const combatService = services.find((s) => s.category === 'combat');
  const workshops = allWorkshops.slice(0, 2);

  return (
    <div className="space-y-24 pb-24">
      {/* Hero */}
      <section className="hero-atmosphere relative border-b border-cb-steel px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="label-caps mb-6 inline-block rounded-full border border-cb-steel px-3 py-1">LA / Orange County</p>
          <h1 className="text-cb-bone">
            Build sharper.
            <br />
            Move stronger.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-cb-gray">
            Software tutoring, robotics mentoring, and beginner Muay Thai instruction grounded in real-world experience.
          </p>
          <p className="text-mono mt-4 text-cb-muted">Private sessions starting at $50.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/booking">Book a Session</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/services">View Services</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Two paths — four offers, presented without a crowded pricing table */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-12 text-center text-cb-bone">Two Worlds</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <PathCard
              icon={Code2}
              iconColor="text-cb-electric"
              accent="border-l-cb-electric"
              title="Code"
              description="Programming fundamentals, debugging, Git/GitHub, AI coding tools, robotics, and ROS."
              service={codeService}
              category="code"
              hasWorkshop={allWorkshops.some((w) => w.category === 'code')}
            />
            <PathCard
              icon={Swords}
              iconColor="text-cb-purple"
              accent="border-l-cb-purple"
              title="Combat"
              description="Beginner Muay Thai fundamentals: footwork, defense, combinations, pad work, and conditioning."
              service={combatService}
              category="combat"
              hasWorkshop={allWorkshops.some((w) => w.category === 'combat')}
            />
          </div>
        </div>
      </section>

      {/* How booking works */}
      <section className="border-y border-cb-steel bg-cb-charcoal px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-cb-bone">How Booking Works</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Step icon={Code2} step="1" title="Pick a path" description="Code or Combat, then private, workshop, or package." />
            <Step icon={CalendarCheck} step="2" title="Pick a time" description="Real-time availability shown in your timezone." />
            <Step icon={MessageSquare} step="3" title="Add your details" description="Name, email, phone, and a short note." />
            <Step icon={ClipboardCheck} step="4" title="Get confirmed" description="Instant confirmation — no payment collected yet." />
          </div>
        </div>
      </section>

      {/* Bio / credentials */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-cb-bone">Instructor</h2>
          <p className="mb-4 text-cb-gray">
            I&apos;m Abel Mendoza — a computer science graduate, robotics operations and electronics-testing
            professional, and a software builder. Former amateur Muay Thai competitor, 6-1-1 official record, and a
            Brazilian Jiu-Jitsu blue belt. I teach coding fundamentals, robotics/ROS, and AI-assisted development on
            one side, and beginner-focused striking on the other — as a practical mentor, not a master or elite
            coach.
          </p>
          <Link href="/about" className="text-cb-bone underline hover:text-cb-electric">
            Read the full background →
          </Link>
        </div>
      </section>

      {/* Upcoming workshops */}
      {workshops.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex items-end justify-between">
              <h2 className="flex items-center gap-3 text-cb-bone">
                <PartyPopper className="h-7 w-7 text-cb-electric" aria-hidden="true" />
                Upcoming Workshops
              </h2>
              <Link href="/workshops" className="text-sm text-cb-gray underline hover:text-cb-bone">
                View all
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {workshops.map((workshop) => (
                <div key={workshop.id} className="card">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="font-bold text-cb-bone">{workshop.title}</h3>
                    <Badge variant={workshop.category}>{workshop.category}</Badge>
                  </div>
                  <p className="text-mono text-sm text-cb-gray">
                    {formatTimeInTimezone(new Date(workshop.startTime), 'America/Los_Angeles', 'MMM d, h:mm a zzz')}
                  </p>
                  <p className="text-mono text-sm text-cb-gray">
                    {Math.max(workshop.capacity - workshop.confirmedCount, 0)} of {workshop.capacity} seats left
                  </p>
                  <Button asChild size="sm" variant="secondary" className="mt-4">
                    <Link href="/workshops">Details &amp; registration</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials — clearly labeled placeholder content */}
      <section className="border-y border-cb-steel bg-cb-charcoal px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-cb-bone">What Clients Say</h2>
          <p className="mb-12 text-center text-mono text-cb-gray">Example placeholder testimonials — real feedback coming soon</p>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="card">
              <p className="mb-4 text-cb-gray">
                &ldquo;Placeholder quote — a short note on what a coding tutoring session was like.&rdquo;
              </p>
              <p className="text-mono text-sm text-cb-gray">— Example client, Code (placeholder)</p>
            </div>
            <div className="card">
              <p className="mb-4 text-cb-gray">
                &ldquo;Placeholder quote — a short note on what a beginner striking session was like.&rdquo;
              </p>
              <p className="text-mono text-sm text-cb-gray">— Example client, Combat (placeholder)</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-cb-bone">FAQ</h2>
          <dl className="space-y-6">
            <Faq q="Do I need experience to start combat training?" a="No — Private Striking Training and the striking Group Workshop are both beginner-focused. We start with stance, guard, and fundamentals." />
            <Faq q="Is martial arts training here medical advice?" a="No. Sessions are beginner-focused instruction, not medical advice, and a signed waiver is required before participation." />
            <Faq q="What if I need to reschedule or cancel?" a="Every confirmation includes a manage link to reschedule or cancel, subject to the notice window shown at booking — free up to 24 hours before your session." />
            <Faq q="Do you offer online sessions?" a="Coding & Tech Tutoring is available online or in person; Private Striking Training and its group workshop are in-person in the LA/Orange County area." />
            <Faq q="How does the Four-Session Package work?" a="Four 60-minute private sessions for $180, in either Code or Combat. Payment integration is coming soon — booking a package starts a request, and Abel follows up to arrange payment." />
            <Faq q="How do group workshops work?" a="Each workshop shows live remaining capacity — book directly into an open slot, no waiting for approval." />
          </dl>
        </div>
      </section>

      {/* Service area note */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded border border-cb-steel bg-cb-dark p-6 text-sm text-cb-gray">
          In-person martial arts sessions serve the LA / Orange County area. Exact meeting locations are shared
          after booking. Coding &amp; Tech Tutoring is available online nationwide.
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-cb-steel bg-cb-charcoal px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-2 text-cb-bone">Ready to start?</h2>
          <p className="text-mono mb-6 text-cb-gray">Private sessions starting at $50.</p>
          <Button asChild size="lg">
            <Link href="/booking">Book a Session</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function PathCard({
  icon: Icon,
  iconColor,
  accent,
  title,
  description,
  service,
  category,
  hasWorkshop,
}: {
  icon: typeof Code2;
  iconColor: string;
  accent: string;
  title: string;
  description: string;
  service?: BookableService;
  category: 'code' | 'combat';
  hasWorkshop: boolean;
}) {
  return (
    <div className={`card border-l-4 ${accent}`}>
      <Icon className={`mb-4 h-8 w-8 ${iconColor}`} aria-hidden="true" />
      <h3 className="mb-4 text-cb-bone">{title}</h3>
      <p className="mb-6 text-cb-gray">{description}</p>
      <ul className="mb-6 space-y-3 text-sm text-cb-gray">
        <li className="flex items-center gap-2">
          <Users className="h-4 w-4 text-cb-bone" aria-hidden="true" />
          {service ? `Private session — ${formatPriceCents(service.priceCents)} / ${service.durationMinutes} min` : 'Private session'}
        </li>
        {hasWorkshop && (
          <li className="flex items-center gap-2">
            <PartyPopper className="h-4 w-4 text-cb-bone" aria-hidden="true" />
            Group workshop — $25/person
          </li>
        )}
        <li className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-cb-bone" aria-hidden="true" />
          Four-session package — $180
        </li>
      </ul>
      <Button asChild variant="secondary">
        <Link href={`/booking?category=${category}`}>Book {title}</Link>
      </Button>
    </div>
  );
}

function Step({
  icon: Icon,
  step,
  title,
  description,
}: {
  icon: typeof Code2;
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-cb-electric/40">
        <Icon className="h-6 w-6 text-cb-electric" aria-hidden="true" />
      </div>
      <p className="text-mono mb-1 text-cb-gray">Step {step}</p>
      <h3 className="mb-2 text-base font-bold text-cb-bone">{title}</h3>
      <p className="text-sm text-cb-gray">{description}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <dt className="mb-1 font-semibold text-cb-bone">{q}</dt>
      <dd className="text-cb-gray">{a}</dd>
    </div>
  );
}
