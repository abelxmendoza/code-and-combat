import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Users, Layers, AppWindow, UserRound, Store, Swords } from 'lucide-react';
import { getBookingRepository } from '@/lib/repository';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPriceCents } from '@/lib/utils';
import type { BookableService } from '@/types/domain';

export const metadata: Metadata = {
  title: 'Services — Code & Combat by Abel',
  description: 'One-on-one coding lessons and private striking training in LA/OC, plus custom software and website development.',
};

export default async function ServicesPage() {
  const repo = getBookingRepository();
  const services = await repo.listActiveServices();
  const codeService = services.find((s) => s.category === 'code');
  const combatService = services.find((s) => s.category === 'combat');
  const assWhoopingService = services.find((s) => s.slug === 'ass-whooping-package');

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-cb-bone">Services</h1>
      <p className="mb-12 max-w-2xl text-cb-gray">
        Start with one-on-one Code or Combat lessons. Custom software and website development is also available.
      </p>

      <div className="flex flex-col gap-16">
        <section
          id="development"
          className="section-glow relative order-2 -mx-4 scroll-mt-24 overflow-hidden rounded border border-cb-cyan/25 bg-cb-charcoal/40 px-4 py-12 shadow-cb-lg sm:px-8 sm:py-14"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cb-cyan to-transparent" />
          <p className="label-caps mb-3 text-cb-cyan">Also Available · Freelance Development</p>
          <h2 className="mb-4 text-cb-bone">Built for your next idea or your growing business.</h2>
          <p className="mb-10 max-w-3xl text-cb-gray">
            Need a new product, a professional online presence, or help improving software you already use? Every
            project starts with your goals, then moves into a clear scope and tailored quote.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            <DevelopmentCard
              icon={AppWindow}
              title="Software & App Development"
              description="Web applications, MVPs, internal tools, workflow automation, integrations, and focused improvements to existing software."
            />
            <DevelopmentCard
              icon={UserRound}
              title="Personal Websites"
              description="Portfolio, résumé, personal brand, and landing-page websites designed to showcase your skills, story, and work."
            />
            <DevelopmentCard
              icon={Store}
              title="Business Websites"
              description="Professional service websites with clear messaging, responsive design, lead capture, booking paths, and room to grow."
            />
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button asChild className="border-cb-cyan bg-cb-black shadow-cb-glow-cyan hover:border-cb-cyan hover:bg-cb-cyan-deep/30">
              <Link href="/contact?inquiry=development">Request a Project Quote</Link>
            </Button>
            <p className="text-mono text-cb-muted">Scope and pricing are tailored to each project.</p>
          </div>
        </section>

        <div className="section-glow order-1 -mx-4 rounded border border-cb-steel/70 bg-cb-charcoal/40 px-4 py-10 shadow-cb-lg sm:px-8">
          <p className="label-caps mb-3 text-cb-cyan">Start Here</p>
          <h2 className="mb-3 text-cb-bone">Code &amp; Combat Lessons</h2>
          <p className="mb-10 max-w-2xl text-cb-gray">Focused one-on-one instruction, clear next steps, and practical work you can build on between sessions.</p>
          <div className="space-y-16">
            {codeService && <OfferSection service={codeService} accent="border-l-cb-cyan" badgeVariant="code" />}
            {combatService && <OfferSection service={combatService} accent="border-l-cb-gold" badgeVariant="combat" />}
            {assWhoopingService && (
              <section>
                <div className="mb-6 flex items-center gap-3">
                  <Swords className="h-6 w-6 text-cb-gold" aria-hidden="true" />
                  <h2 className="text-cb-bone">{assWhoopingService.name}</h2>
                  <Badge variant="combat">combat</Badge>
                </div>
                <div className="card card-interactive card-combat max-w-2xl border-t-2 border-t-cb-gold/70">
                  <p className="mb-4 text-cb-gray">{assWhoopingService.fullDescription}</p>
                  <div className="mb-4 flex flex-wrap items-center gap-3 text-mono text-cb-gray">
                    <span>{assWhoopingService.durationMinutes} min</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatPriceCents(assWhoopingService.priceCents)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{assWhoopingService.deliveryType}</span>
                  </div>
                  <Button asChild>
                    <Link href={`/booking?service=${assWhoopingService.slug}`}>Book</Link>
                  </Button>
                </div>
              </section>
            )}

            <section>
              <div className="mb-6 flex items-center gap-3">
                <Layers className="h-6 w-6 text-cb-electric" aria-hidden="true" />
                <h2 className="text-cb-bone">Four-Session Package</h2>
              </div>
              <div className="card card-interactive max-w-2xl border-t-2 border-t-cb-electric/70">
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
              Martial arts sessions are beginner-focused and are not medical advice. Participation requires accepting
              a waiver, presented during booking. In-person sessions serve the LA / Orange County area.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DevelopmentCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof AppWindow;
  title: string;
  description: string;
}) {
  return (
    <div className="card card-interactive card-code border-t-2 border-t-cb-cyan/70">
      <Icon className="mb-4 h-7 w-7 text-cb-cyan" aria-hidden="true" />
      <h3 className="mb-3 text-xl text-cb-bone">{title}</h3>
      <p className="text-sm text-cb-gray">{description}</p>
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
  const isCode = badgeVariant === 'code';
  const imageSrc = isCode ? '/meComputer.jpg' : '/meFighter.jpg';
  const imageAlt = isCode
    ? 'Abel Mendoza working on software at his laptop'
    : 'Abel Mendoza holding a Muay Thai trophy with his hand wrapped';

  return (
    <section className={`group card card-interactive border-l-4 ${accent} ${isCode ? 'card-code' : 'card-combat'}`}>
      <div className="grid gap-7 md:grid-cols-[220px_1fr]">
        <div className="relative aspect-[4/5] overflow-hidden rounded border border-cb-steel md:aspect-auto md:min-h-[340px]">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 220px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            style={{ objectPosition: isCode ? 'center 42%' : 'center 24%' }}
          />
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${isCode ? 'from-cb-cyan-deep/55' : 'from-cb-void/65'} via-transparent to-transparent`} />
        </div>
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <Users className={`h-6 w-6 ${isCode ? 'text-cb-cyan' : 'text-cb-gold'}`} aria-hidden="true" />
            <h2 className="text-cb-bone">{service.name}</h2>
            <Badge variant={badgeVariant}>{badgeVariant}</Badge>
          </div>
          <p className="mb-4 max-w-2xl text-cb-gray">{service.fullDescription}</p>
          {isCode && (
            <p className="mb-4 max-w-2xl rounded border border-cb-cyan/30 bg-cb-cyan-deep/20 p-4 text-sm text-cb-gray">
              <strong className="text-cb-cyan">College mentorship included:</strong> support for community college and
              university students working through coursework, projects, and the transition into practical development.
            </p>
          )}
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
        </div>
      </div>
    </section>
  );
}
