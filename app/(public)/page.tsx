import Link from 'next/link';
import Image from 'next/image';
import { Code2, Swords, CalendarCheck, MessageSquare, ClipboardCheck, Users, Layers, AppWindow, UserRound, Store } from 'lucide-react';
import { getBookingRepository } from '@/lib/repository';
import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { formatPriceCents } from '@/lib/utils';
import type { BookableService } from '@/types/domain';

export default async function Home() {
  const repo = getBookingRepository();
  const services = await repo.listActiveServices();
  const codeService = services.find((s) => s.category === 'code');
  const combatService = services.find((s) => s.category === 'combat');

  return (
    <div className="space-y-24 pb-24">
      {/* Hero */}
      <section className="hero-atmosphere relative border-b border-cb-steel px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="animate-rise mx-auto max-w-4xl text-center">
          <Logo className="mx-auto mb-8 h-44 drop-shadow-[0_0_28px_rgba(139,92,246,0.22)] sm:h-52 lg:h-60" priority />
          <p className="label-caps mb-6 inline-block rounded-full border border-cb-cyan/30 bg-cb-cyan-deep/20 px-3 py-1 text-cb-cyan">LA / Orange County</p>
          <h1 className="text-cb-bone">
            Build sharper.
            <br />
            Move stronger.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-cb-gray">
            One-on-one coding, college, and university mentorship — plus beginner Muay Thai lessons grounded in
            real-world experience.
          </p>
          <p className="text-mono mt-5 inline-flex items-center gap-1.5 rounded-full border border-cb-cyan/40 bg-cb-cyan-deep/25 px-4 py-1.5 text-base font-semibold text-cb-cyan shadow-cb-glow-cyan">
            Private Code and Combat sessions starting at <span className="text-lg">$50</span>
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/booking">Book Code or Combat</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/services#development">Software &amp; Websites</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Training and mentoring */}
      <section className="section-glow px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="label-caps mb-3 text-center text-cb-cyan">Start Here</p>
          <h2 className="mb-4 text-center text-cb-bone">Choose your lesson.</h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-cb-gray">Practical one-on-one instruction built around where you are now and what you want to improve next.</p>
          <div className="grid gap-8 md:grid-cols-2">
            <PathCard
              icon={Code2}
              iconColor="text-cb-cyan"
              accent="border-l-cb-cyan"
              cardClass="card-code animate-rise animation-delay-100"
              imageSrc="/meComputer.jpg"
              imageAlt="Abel Mendoza working on software at his laptop"
              imagePosition="center 42%"
              title="Code"
              description="Programming fundamentals, debugging, Git/GitHub, AI tools, robotics and ROS, plus community college and university mentorship."
              service={codeService}
              category="code"
            />
            <PathCard
              icon={Swords}
              iconColor="text-cb-gold"
              accent="border-l-cb-gold"
              cardClass="card-combat animate-rise animation-delay-200"
              imageSrc="/meFighter.jpg"
              imageAlt="Abel Mendoza holding a Muay Thai trophy with his hand wrapped"
              imagePosition="center 24%"
              title="Combat"
              description="Beginner Muay Thai fundamentals: footwork, defense, combinations, pad work, and conditioning."
              service={combatService}
              category="combat"
            />
          </div>
          <p className="text-mono mx-auto mt-8 max-w-xl text-center text-cb-muted">
            Small-group Code and Combat workshops are in the works. Details later.
          </p>
        </div>
      </section>

      {/* How booking works */}
      <section className="border-y border-cb-steel bg-cb-charcoal px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-cb-bone">How Booking Works</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Step icon={Code2} step="1" title="Pick a path" description="Code or Combat, then choose a private session or package." />
            <Step icon={CalendarCheck} step="2" title="Pick a time" description="Real-time availability shown in your timezone." />
            <Step icon={MessageSquare} step="3" title="Add your details" description="Name, email, phone, and a short note." />
            <Step icon={ClipboardCheck} step="4" title="Get confirmed" description="Instant confirmation — no payment collected yet." />
          </div>
        </div>
      </section>

      {/* Freelance development */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl border-t border-cb-steel pt-20">
          <p className="label-caps mb-3 text-center text-cb-electric">Also Available</p>
          <h2 className="mb-4 text-center text-cb-bone">Need something built?</h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-cb-gray">
            I also build focused websites and custom applications for individuals and businesses.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            <ProjectCard icon={AppWindow} title="Software & App Development" description="Custom web apps, internal tools, automations, MVPs, and feature development for an existing product." />
            <ProjectCard icon={UserRound} title="Personal Websites" description="Portfolio, résumé, personal brand, and landing-page sites that present your work clearly and professionally." />
            <ProjectCard icon={Store} title="Business Websites" description="Fast, polished service websites built to explain your offer, earn trust, and turn visitors into leads." />
          </div>
          <div className="mt-10 text-center">
            <Button asChild variant="secondary"><Link href="/contact?inquiry=development">Tell Me About Your Project</Link></Button>
            <p className="text-mono mt-3 text-cb-muted">Scope and pricing are tailored to each project.</p>
          </div>
        </div>
      </section>

      {/* Bio / credentials */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-cb-bone">About Abel</h2>
          <p className="mb-4 text-cb-gray">
            I&apos;m Abel Mendoza — a computer science graduate, robotics operations and electronics-testing
            professional, and a software builder. I build custom apps and websites for individuals and businesses,
            and teach coding fundamentals, robotics/ROS, and AI-assisted development. I&apos;m also an amateur
            Muay Thai competitor with a 6-1-1 official record (if you ask me, I&apos;m still undefeated 8-0 though) and a
            Brazilian Jiu-Jitsu blue belt with tournament
            experience, trained by some of the best Muay Thai, MMA, and BJJ coaches in the LA/Orange County area —
            offering beginner-focused striking as a practical mentor, not a master or elite coach.
          </p>
          <Link href="/about" className="text-cb-bone underline hover:text-cb-electric">
            Read the full background →
          </Link>
        </div>
      </section>

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
            <Faq q="Do I need experience to start combat training?" a="No — Private Striking Training is beginner-focused. We start with stance, guard, and fundamentals." />
            <Faq q="Is martial arts training here medical advice?" a="No. Sessions are beginner-focused instruction, not medical advice, and a signed waiver is required before participation." />
            <Faq q="What if I need to reschedule or cancel?" a="Every confirmation includes a manage link to reschedule or cancel, subject to the notice window shown at booking — free up to 24 hours before your session." />
            <Faq q="Do you offer online sessions?" a="Coding & Tech Tutoring is available online or in person; Private Striking Training is in-person in the LA/Orange County area." />
            <Faq q="Do you mentor college students?" a="Yes. Code mentorship is available for community college and university students who want support understanding coursework, developing projects, and building practical developer skills." />
            <Faq q="How does the Four-Session Package work?" a="Four 60-minute private sessions for $180, in either Code or Combat. Payment integration is coming soon — booking a package starts a request, and Abel follows up to arrange payment." />
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
          <p className="text-mono mb-6 inline-flex items-center gap-1.5 rounded-full border border-cb-cyan/40 bg-cb-cyan-deep/25 px-4 py-1.5 text-base font-semibold text-cb-cyan shadow-cb-glow-cyan">
            Private sessions starting at <span className="text-lg">$50</span>
          </p>
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
  cardClass,
  imageSrc,
  imageAlt,
  imagePosition,
}: {
  icon: typeof Code2;
  iconColor: string;
  accent: string;
  title: string;
  description: string;
  service?: BookableService;
  category: 'code' | 'combat';
  cardClass?: string;
  imageSrc: string;
  imageAlt: string;
  imagePosition: string;
}) {
  return (
    <div className={`group card card-interactive border-l-4 ${accent} ${cardClass ?? ''}`}>
      <div className="relative -mx-6 -mt-6 mb-6 aspect-[4/3] overflow-hidden border-b border-cb-steel">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          style={{ objectPosition: imagePosition }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cb-charcoal/55 via-transparent to-transparent" />
      </div>
      <Icon className={`mb-4 h-8 w-8 ${iconColor}`} aria-hidden="true" />
      <h3 className="mb-4 text-cb-bone">{title}</h3>
      <p className="mb-6 text-cb-gray">{description}</p>
      <ul className="mb-6 space-y-3 text-sm text-cb-gray">
        <li className="flex items-center gap-2">
          <Users className="h-4 w-4 text-cb-bone" aria-hidden="true" />
          {service ? `Private session — ${formatPriceCents(service.priceCents)} / ${service.durationMinutes} min` : 'Private session'}
        </li>
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

function ProjectCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Code2;
  title: string;
  description: string;
}) {
  return (
    <div className="card card-interactive border-t-2 border-t-cb-electric/70">
      <Icon className="mb-4 h-7 w-7 text-cb-electric" aria-hidden="true" />
      <h3 className="mb-3 text-xl text-cb-bone">{title}</h3>
      <p className="text-sm text-cb-gray">{description}</p>
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
