import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'About — Code & Combat by Abel',
  description: 'Abel Mendoza is a Mexican-American software developer, robotics technician, and 6-1-1 amateur Muay Thai competitor based in LA/Orange County.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-4 text-cb-bone">About</h1>
      <p className="mb-12 text-lg text-cb-gray">
        I&apos;m Abel Mendoza — a Mexican-American software developer, robotics technician, and Muay Thai competitor
        based in LA/Orange County. I teach from experience: building, debugging, training, and doing the work myself.
      </p>

      <div className="space-y-12">
        <section>
          <h2 className="mb-4 text-cb-electric">Code</h2>
          <div className="space-y-4 text-cb-gray">
            <p>
              I earned my bachelor&apos;s degree in Computer Science from Cal State Fullerton, then took those skills
              into the field.
            </p>
            <p>
              My experience spans robotics operations, electronics testing and validation, hardware troubleshooting,
              and software development — working on systems that have to function outside the classroom.
            </p>
            <p>
              I work with Python, C++, ROS, Git, and modern AI-assisted development tools. I teach AI as part of a
              real development workflow: useful for moving faster, but never a substitute for understanding what
              you&apos;re building.
            </p>
            <p>
              I also built <strong className="text-cb-bone">LoreBook</strong>, a personal knowledge and memory
              platform, from the ground up.
            </p>
            <p>
              Beyond code, I also offer counseling on physics and engineering — coursework, problem sets, and the
              concepts that trip people up between the classroom and the real thing.
            </p>
            <p>Whether you&apos;re learning your first programming concepts or trying to turn an idea into a working project, the goal is the same:</p>
          </div>
          <p className="mt-6 border-l-2 border-cb-electric pl-5 text-lg font-bold text-cb-bone">
            Understand the system. Then build something real.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-cb-purple">Combat</h2>
          <div className="space-y-4 text-cb-gray">
            <p>
              I have a <strong className="text-cb-bone">6-1-1 amateur Muay Thai record</strong> (if you ask me,
              I&apos;m still undefeated 8-0 though) and I&apos;m a{' '}
              <strong className="text-cb-bone">Brazilian Jiu-Jitsu blue belt</strong> with tournament experience.
              I&apos;ve trained under some of the best Muay Thai, MMA, and BJJ coaches in the LA/Orange County area.
            </p>
            <p>
              My private sessions focus on beginner striking fundamentals: stance, guard, movement, defense,
              combinations, pad work, and conditioning.
            </p>
            <p>
              You don&apos;t need to be preparing for a fight. You don&apos;t need to already be in shape. You just need
              to be willing to learn and put in the rounds.
            </p>
            <p>The goal is simple:</p>
          </div>
          <p className="mt-6 border-l-2 border-cb-purple pl-5 text-lg font-bold text-cb-bone">
            Move with purpose. Hit with technique. Build confidence through repetition.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-cb-bone">What I Teach</h2>
          <div className="space-y-4 text-cb-gray">
            <p>I stick to what I know and use.</p>
            <p>
              For software, that means programming fundamentals, practical development, debugging, developer tools,
              AI-assisted workflows, introductory robotics and ROS, and mentorship for community college and
              university students.
            </p>
            <p>
              For Muay Thai, that means beginner through early-intermediate striking and conditioning.
            </p>
            <p>
              When what you need goes beyond my experience, I&apos;ll tell you. Good instruction isn&apos;t pretending to
              know everything — it&apos;s knowing what you can teach well.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-cb-bone">Why Code &amp; Combat?</h2>
          <div className="space-y-4 text-cb-gray">
            <p>Software and fighting look like completely different worlds.</p>
            <p>The process isn&apos;t.</p>
            <p>
              You try. You fail. You debug. You drill. Someone catches the mistake. You correct it and run it again.
            </p>
            <p>
              Progress comes from showing up for the unglamorous reps until things that once felt impossible become
              automatic.
            </p>
          </div>
          <p className="mt-6 text-xl font-bold text-cb-bone">Build sharper. Move stronger.</p>
        </section>
      </div>

      <div className="mt-12 flex flex-wrap gap-4 border-t border-cb-steel pt-8">
        <Button asChild>
          <Link href="/contact?inquiry=development">Start a project</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/booking">Book a session</Link>
        </Button>
      </div>
    </div>
  );
}
