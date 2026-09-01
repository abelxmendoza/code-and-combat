'use client';

import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReviewItemData } from './review-step';

export interface ConfirmedAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function ConfirmedStep({
  heading,
  reference,
  message,
  items,
  footnote,
  actions,
  onBookAnother,
}: {
  heading: string;
  reference: string;
  message: string;
  items: ReviewItemData[];
  footnote?: string;
  actions: ConfirmedAction[];
  onBookAnother: () => void;
}) {
  return (
    <div className="text-center">
      <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-cb-electric" aria-hidden="true" />
      <h2 className="mb-2 text-cb-bone">{heading}</h2>
      <p className="mb-8 text-cb-gray">
        Reference <span className="text-mono text-cb-bone">{reference}</span> — {message}
      </p>

      <dl className="card mx-auto grid max-w-md gap-4 text-left">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-mono text-cb-gray">{item.label}</dt>
            <dd className="text-cb-bone">{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {actions.map((action) =>
          action.href ? (
            <Button key={action.label} asChild variant={action.variant ?? 'secondary'}>
              <a href={action.href}>{action.label}</a>
            </Button>
          ) : (
            <Button key={action.label} type="button" variant={action.variant ?? 'secondary'} onClick={action.onClick}>
              {action.label}
            </Button>
          ),
        )}
        <Button type="button" onClick={onBookAnother}>
          Book another session
        </Button>
      </div>

      {footnote && <p className="mx-auto mt-6 max-w-md text-sm text-cb-gray">{footnote}</p>}
    </div>
  );
}
