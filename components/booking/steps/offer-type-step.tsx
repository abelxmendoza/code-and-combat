'use client';

import { Users, PartyPopper, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatPriceCents } from '@/lib/utils';
import type { BookableService, ServiceCategory } from '@/types/domain';
import type { OfferType } from '@/store/bookingSlice';

export function OfferTypeStep({
  category,
  privateService,
  hasWorkshops,
  onSelect,
  onBack,
}: {
  category: ServiceCategory;
  privateService?: BookableService;
  hasWorkshops: boolean;
  onSelect: (offerType: OfferType) => void;
  onBack: () => void;
}) {
  const label = category === 'code' ? 'Coding & Tech Tutoring' : 'Private Striking Training';

  return (
    <div>
      <h2 className="mb-2 text-cb-bone">How would you like to train?</h2>
      <p className="mb-8 text-cb-gray">Three ways to get started — pick the one that fits.</p>

      <div className="grid gap-4 sm:grid-cols-3">
        <OfferCard
          icon={Users}
          title="Private Session"
          description={privateService?.shortDescription ?? label}
          meta={privateService ? `${privateService.durationMinutes} min · ${formatPriceCents(privateService.priceCents)}` : undefined}
          onClick={() => onSelect('private')}
          disabled={!privateService}
        />
        <OfferCard
          icon={PartyPopper}
          title="Group Workshop"
          description="A small-group class or seminar with live availability shown."
          meta={hasWorkshops ? 'Upcoming dates available' : 'None scheduled right now'}
          onClick={() => onSelect('workshop')}
          disabled={!hasWorkshops}
        />
        <OfferCard
          icon={Layers}
          title="Four-Session Package"
          description={`Four ${label.toLowerCase()} sessions, bundled.`}
          meta="$180 total · 4 × 60 min"
          onClick={() => onSelect('package')}
        />
      </div>

      <div className="mt-8">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}

function OfferCard({
  icon: Icon,
  title,
  description,
  meta,
  onClick,
  disabled,
}: {
  icon: typeof Users;
  title: string;
  description: string;
  meta?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'card flex flex-col items-start gap-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cb-crimson',
        disabled ? 'cursor-not-allowed opacity-40' : 'hover:border-cb-gray',
      )}
    >
      <Icon className="h-6 w-6 text-cb-crimson" aria-hidden="true" />
      <h3 className="text-base font-bold text-cb-bone">{title}</h3>
      <p className="text-sm text-cb-gray">{description}</p>
      {meta && <p className="text-mono mt-auto text-cb-gray">{meta}</p>}
    </button>
  );
}
