'use client';

import { Code2, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ServiceCategory } from '@/types/domain';

export function CategoryStep({
  onSelect,
}: {
  onSelect: (category: ServiceCategory) => void;
}) {
  return (
    <div>
      <h2 className="mb-2 text-cb-bone">What are you here for?</h2>
      <p className="mb-8 text-cb-gray">Pick a path to see the relevant services.</p>
      <div className="grid gap-6 sm:grid-cols-2">
        <CategoryCard
          category="code"
          title="Code"
          description="Tutoring, robotics mentoring, AI-assisted development, and technical workshops."
          Icon={Code2}
          accent="border-cb-electric/40 hover:border-cb-electric"
          onSelect={onSelect}
        />
        <CategoryCard
          category="combat"
          title="Combat"
          description="Beginner Muay Thai, private striking, pad work, and small-group sessions."
          Icon={Swords}
          accent="border-cb-crimson/40 hover:border-cb-crimson"
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}

function CategoryCard({
  category,
  title,
  description,
  Icon,
  accent,
  onSelect,
}: {
  category: ServiceCategory;
  title: string;
  description: string;
  Icon: typeof Code2;
  accent: string;
  onSelect: (category: ServiceCategory) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(category)}
      className={cn(
        'card flex flex-col items-start gap-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cb-crimson',
        accent,
      )}
    >
      <Icon className="h-8 w-8 text-cb-bone" aria-hidden="true" />
      <div>
        <h3 className="mb-2 text-cb-bone">{title}</h3>
        <p className="text-sm text-cb-gray">{description}</p>
      </div>
    </button>
  );
}
