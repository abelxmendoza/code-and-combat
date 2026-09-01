import Link from 'next/link';
import { Code2, Swords, CalendarCheck, MessageSquare, ClipboardCheck, PartyPopper, Hammer } from 'lucide-react';
import { getActiveServices } from '@/lib/db/services';
import { getUpcomingWorkshops } from '@/lib/db/events';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPriceCents } from '@/lib/utils';
import { formatTimeInTimezone } from '@/lib/timezone';

const DEV_DISCOVERY_SLUG = 'dev-discovery-call';

export default async function Home() {
  const services = await getActiveServices();
  const devDiscoveryCall = services.find((s) => s.slug === DEV_DISCOVERY_SLUG);
  const featured = services.filter((s) => s.slug !== DEV_DISCOVERY_SLUG).slice(0, 3);
  const workshops = (await getUpcomingWorkshops()).slice(0, 2);

  return (
    <div className="space-y-24 pb-24">
      {/* Hero */}
      <section className="grid-lines border-b border-cb-steel px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-mono mb-4 text-cb-gray">LA / ORANGE COUNTY</p>
          <h1 className="text-cb-bone">
            Build sharper.
            <br />
            Move stronger.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-cb-gray">
            Software tutoring, robotics mentoring, and beginner Muay Thai instruction from a practitioner, not a
            guru.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/booking">Book a Session</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/services">Explore Services</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Two paths */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-12 text-center text-cb-bone">Two Worlds</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="card border-l-4 border-l-cb-electric">
              <Code2 className="mb-4 h-8 w-8 text-cb-electric" aria-hidden="true" />
              <h3 className="mb-4 text-cb-bone">Code</h3>
              <p className="mb-6 text-cb-gray">
                Python, C++, robotics, ROS, AI-assisted development. Learn by building real things.
              </p>
              <ul className="space-y-2 text-sm text-cb-gray">
                <li>One-on-one tutoring</li>
                <li>Project &amp; portfolio reviews</li>
                <li>Robotics / ROS mentoring</li>
                <li>Small-group workshops</li>
              </ul>
              <Button asChild variant="secondary" className="mt-6">
                <Link href="/booking?category=code">Book Code</Link>
              </Button>
            </div>
            <div className="card border-l-4 border-l-cb-crimson">
              <Swords className="mb-4 h-8 w-8 text-cb-crimson" aria-hidden="true" />
              <h3 className="mb-4 text-cb-bone">Combat</h3>
              <p className="mb-6 text-cb-gray">
                Beginner Muay Thai fundamentals: stance, footwork, pad work, and conditioning.
              </p>
              <ul className="space-y-2 text-sm text-cb-gray">
                <li>Private striking lessons</li>
                <li>Footwork &amp; defensive movement</li>
                <li>Pad work &amp; conditioning</li>
                <li>Small-group outdoor sessions</li>
              </ul>
              <Button asChild variant="secondary" className="mt-6">
                <Link href="/booking?category=combat">Book Combat</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Custom development — hire-to-build */}
      {devDiscoveryCall && (
        <section className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl rounded border border-cb-electric/40 bg-cb-charcoal p-8 sm:p-12">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="max-w-xl">
                <div className="mb-3 flex items-center gap-2 text-cb-electric">
                  <Hammer className="h-5 w-5" aria-hidden="true" />
                  <p className="text-mono">AVAILABLE FOR HIRE</p>
                </div>
                <h2 className="mb-2 text-cb-bone">Need something built?</h2>
                <p className="text-cb-gray">
                  Personal websites, business landing pages, or a full app idea — I build real software, scoped and
                  quoted after a free call.
                </p>
              </div>
              <Button asChild size="lg">
                <Link href={`/booking?service=${devDiscoveryCall.slug}`}>Book a Free Discovery Call</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Featured services */}
      {featured.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex items-end justify-between">
              <h2 className="text-cb-bone">Featured Services</h2>
              <Link href="/services" className="text-sm text-cb-gray underline hover:text-cb-bone">
                View all
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {featured.map((service) => (
                <div key={service.id} className="card flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-cb-bone">{service.name}</h3>
                    <Badge variant={service.category}>{service.category}</Badge>
                  </div>
                  <p className="text-sm text-cb-gray">{service.shortDescription}</p>
                  <p className="text-mono text-cb-gray">
                    {service.durationMinutes} min · {formatPriceCents(service.priceCents)}
                    {service.priceUnit === 'person' ? '/person' : ''}
                  </p>
                  <Button asChild size="sm" className="mt-auto">
                    <Link href={`/booking?service=${service.slug}`}>Book</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How booking works */}
      <section className="border-y border-cb-steel bg-cb-charcoal px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-cb-bone">How Booking Works</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Step icon={Code2} step="1" title="Pick a service" description="Choose Code or Combat, then the specific session." />
            <Step icon={CalendarCheck} step="2" title="Pick a time" description="Real-time availability shown in your timezone." />
            <Step icon={MessageSquare} step="3" title="Add your details" description="Name, email, and any notes for the session." />
            <Step icon={ClipboardCheck} step="4" title="Get confirmed" description="Instant confirmation with a calendar file and manage link." />
          </div>
        </div>
      </section>

      {/* Bio / credentials */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-cb-bone">Instructor</h2>
          <p className="mb-4 text-cb-gray">
            I&apos;m Abel Mendoza — CS graduate, robotics field-operations technician, and a 6-0 amateur Muay Thai
            competitor. I teach coding fundamentals, robotics/ROS, and AI-assisted development on one side, and
            beginner-focused striking on the other.
          </p>
          <Link href="/about" className="text-cb-bone underline hover:text-cb-crimson">
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
                <PartyPopper className="h-7 w-7 text-cb-crimson" aria-hidden="true" />
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
                    {formatTimeInTimezone(new Date(workshop.start_time), 'America/Los_Angeles', 'MMM d, h:mm a zzz')}
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
            <Faq q="Do I need experience to start combat training?" a="No — every combat service on this site is beginner-focused. We start with stance, guard, and fundamentals." />
            <Faq q="Is martial arts training here medical advice?" a="No. Sessions are beginner-focused instruction, not medical advice, and a signed waiver is required before participation." />
            <Faq q="What if I need to reschedule or cancel?" a="Every confirmation includes a secure manage link to reschedule or cancel yourself, subject to the notice window shown at booking." />
            <Faq q="Do you offer online sessions?" a="Most code services are online or hybrid; combat sessions are in-person in the LA/Orange County area." />
            <Faq q="How do group sessions work?" a="Small-group services show live remaining capacity — book directly into an open slot, no waiting for approval." />
          </dl>
        </div>
      </section>

      {/* Service area note */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded border border-cb-steel bg-cb-dark p-6 text-sm text-cb-gray">
          In-person martial arts sessions serve the LA / Orange County area. Exact meeting locations are shared
          after booking. Code sessions are available online nationwide.
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-cb-steel bg-cb-charcoal px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-6 text-cb-bone">Ready to start?</h2>
          <Button asChild size="lg">
            <Link href="/booking">Book Your First Session</Link>
          </Button>
        </div>
      </section>
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
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-cb-crimson/40">
        <Icon className="h-6 w-6 text-cb-crimson" aria-hidden="true" />
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
