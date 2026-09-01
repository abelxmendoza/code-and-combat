import type { Metadata } from 'next';
import Link from 'next/link';
import { Globe, LayoutTemplate, Smartphone, Rocket } from 'lucide-react';
import { getActiveServices } from '@/lib/db/services';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPriceCents } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Services — Code & Combat by Abel',
  description: 'Coding tutoring, custom website/app development, robotics mentoring, and beginner Muay Thai instruction in LA/OC.',
};

const DEV_DISCOVERY_SLUG = 'dev-discovery-call';

export default async function ServicesPage() {
  const services = await getActiveServices();
  const devDiscoveryCall = services.find((s) => s.slug === DEV_DISCOVERY_SLUG);
  const codeServices = services.filter((s) => s.category === 'code' && s.slug !== DEV_DISCOVERY_SLUG);
  const combatServices = services.filter((s) => s.category === 'combat');

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-cb-bone">Services</h1>
      <p className="mb-12 max-w-2xl text-cb-gray">
        Editable, real offerings — pricing and durations shown here are current starting points, not fixed forever.
      </p>

      {/* Custom development — hire-to-build, distinct from tutoring below */}
      <section className="mb-16 rounded border border-cb-electric/40 bg-cb-charcoal p-6 sm:p-10">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-mono mb-2 text-cb-electric">AVAILABLE FOR HIRE</p>
            <h2 className="text-cb-bone">Custom Website &amp; App Development</h2>
            <p className="mt-2 max-w-2xl text-cb-gray">
              Beyond tutoring, I build software for people who need something made: personal websites, business
              landing pages, or a full web app for a product idea. Real projects, scoped and quoted individually —
              not a fixed-price template.
            </p>
          </div>
          {devDiscoveryCall && (
            <Button asChild size="lg" className="shrink-0">
              <Link href={`/booking?service=${devDiscoveryCall.slug}`}>Book a Free Discovery Call</Link>
            </Button>
          )}
        </div>

        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <DevOffer icon={LayoutTemplate} title="Personal sites" description="Portfolios, resumes, personal brand pages." />
          <DevOffer icon={Globe} title="Business landing pages" description="Fast, clean marketing pages that convert." />
          <DevOffer icon={Rocket} title="Web apps / MVPs" description="A product idea, built and shipped end to end." />
          <DevOffer icon={Smartphone} title="Something else" description="Have a different idea? Bring it to the call." />
        </div>

        {devDiscoveryCall && (
          <div className="flex flex-wrap items-center gap-3 text-mono text-cb-gray">
            <span>{devDiscoveryCall.durationMinutes} min call</span>
            <span aria-hidden="true">·</span>
            <span className="text-cb-electric">Free</span>
            <span aria-hidden="true">·</span>
            <span>Custom quote after — no obligation</span>
          </div>
        )}
      </section>

      <section className="mb-16">
        <h2 className="mb-6 text-cb-electric">Code Tutoring &amp; Mentoring</h2>
        {codeServices.length === 0 ? (
          <p className="text-cb-gray">No active code services right now.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {codeServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-6 text-cb-crimson">Combat</h2>
        {combatServices.length === 0 ? (
          <p className="text-cb-gray">No active combat services right now.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {combatServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
        <p className="mt-8 max-w-2xl rounded border border-cb-amber/40 bg-cb-dark p-4 text-sm text-cb-gray">
          Martial arts sessions are beginner-focused and are not medical advice. Participation requires accepting a
          waiver, presented during booking. Sessions serve the LA / Orange County area.
        </p>
      </section>
    </div>
  );
}

function DevOffer({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Globe;
  title: string;
  description: string;
}) {
  return (
    <div>
      <Icon className="mb-3 h-6 w-6 text-cb-electric" aria-hidden="true" />
      <p className="mb-1 font-semibold text-cb-bone">{title}</p>
      <p className="text-sm text-cb-gray">{description}</p>
    </div>
  );
}

function ServiceCard({ service }: { service: Awaited<ReturnType<typeof getActiveServices>>[number] }) {
  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold text-cb-bone">{service.name}</h3>
        <Badge variant={service.category}>{service.category}</Badge>
      </div>
      <p className="text-sm text-cb-gray">{service.shortDescription}</p>
      <div className="flex flex-wrap items-center gap-3 text-mono text-cb-gray">
        <span>{service.durationMinutes} min</span>
        <span aria-hidden="true">·</span>
        <span>
          {service.priceCents === 0 ? 'Free' : formatPriceCents(service.priceCents)}
          {service.priceUnit === 'person' ? ' / person' : ''}
        </span>
        <span aria-hidden="true">·</span>
        <span>{service.deliveryType}</span>
      </div>
      <Button asChild className="mt-auto">
        <Link href={`/booking?service=${service.slug}`}>Book</Link>
      </Button>
    </div>
  );
}
