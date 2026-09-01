import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'About — Code & Combat by Abel',
  description: 'Abel Mendoza: CSUF Computer Science graduate, robotics industry experience, and a 6-1-1 amateur Muay Thai competitor teaching in LA/OC.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-4 text-cb-bone">About</h1>
      <p className="mb-12 text-lg text-cb-gray">
        I&apos;m Abel Mendoza — a Mexican-American software builder and Muay Thai competitor based in LA/Orange
        County. I teach two things I actually do, not two things I read about.
      </p>

      <div className="space-y-12">
        <section>
          <h2 className="mb-4 text-cb-electric">Code</h2>
          <p className="text-cb-gray">
            Bachelor&apos;s degree in Computer Science from Cal State Fullerton, plus field time that doesn&apos;t
            show up in a classroom: robotics industry experience — operations, electronics testing and validation,
            and troubleshooting hardware that has to work in the real world, not just in simulation. I build software
            day to day — Python, C++, ROS, Git — and use current AI-assisted development tools as part of that
            workflow, not as a replacement for understanding what the code does. I built LoreBook, a personal
            knowledge and memory platform, from scratch.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-cb-crimson">Combat</h2>
          <p className="text-cb-gray">
            6-1-1 amateur Muay Thai record. Brazilian Jiu-Jitsu blue belt. I teach beginner striking fundamentals —
            stance, guard, footwork, pad work, and conditioning — the same way I&apos;d coach someone before their
            first fight, without the pressure of one. This is beginner-focused instruction, not medical advice, and
            not a shortcut to a fight camp.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-cb-bone">Honest scope</h2>
          <p className="text-cb-gray">
            I&apos;m a practitioner, not a guru. On the code side, I can take you from fundamentals through practical
            project work, robotics/ROS basics, and a real developer workflow — I&apos;m not going to pretend to be a
            specialist in every language or framework that exists. On the combat side, I teach beginner-to-early
            intermediate striking; if you&apos;re training for competition at a serious level, you&apos;ll outgrow
            private lessons and need a full gym. I&apos;ll tell you when that point comes.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-cb-bone">Why both, under one name</h2>
          <p className="text-cb-gray">
            Building software and training to fight both reward the same thing: showing up, doing the unglamorous
            reps, and getting corrected without taking it personally. Code &amp; Combat is that approach applied to
            two different rooms.
          </p>
        </section>
      </div>

      <div className="mt-12 flex flex-wrap gap-4 border-t border-cb-steel pt-8">
        <Button asChild>
          <Link href="/booking">Book a session</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/services">Browse services</Link>
        </Button>
      </div>
    </div>
  );
}
