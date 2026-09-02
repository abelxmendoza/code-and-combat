'use client';

import { Users, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatPriceCents } from '@/lib/utils';
import type { BookableService, ServiceCategory } from '@/types/domain';
import type { OfferType } from '@/store/bookingSlice';

export function OfferTypeStep({
  category,
  privateServices,
  onSelect,
  onBack,
}: {
  category: ServiceCategory;
  privateServices: BookableService[];
  onSelect: (offerType: OfferType, serviceId?: string) => void;
  onBack: () => void;
}) {
  const label = category === 'code' ? 'Coding & Tech Tutoring' : 'Private Striking Training';

  return (
    <div>
      <h2 className="mb-2 text-cb-bone">How would you like to train?</h2>
      <p className="mb-8 text-cb-gray">Pick the option that fits.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {privateServices.map((service) => (
          <OfferCard
            key={service.id}
            icon={Users}
            title={service.name}
            description={service.shortDescription}
            meta={`${service.durationMinutes} min · ${formatPriceCents(service.priceCents)}`}
            onClick={() => onSelect('private', service.id)}
          />
        ))}
        <OfferCard
          icon={Layers}
          title="Four-Session Package"
          description={`Four ${label.toLowerCase()} sessions, bundled.`}
          meta="$180 total · 4 × 60 min"
          onClick={() => onSelect('package')}
        />
      </div>

      <p className="text-mono mt-5 text-cb-muted">Small-group workshops are coming later.</p>

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
        'card flex flex-col items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cb-electric',
        disabled ? 'cursor-not-allowed opacity-40' : 'glow-border',
      )}
    >
      <Icon className="h-6 w-6 text-cb-electric" aria-hidden="true" />
      <h3 className="text-base font-bold text-cb-bone">{title}</h3>
      <p className="text-sm text-cb-gray">{description}</p>
      {meta && <p className="text-mono mt-auto text-cb-muted">{meta}</p>}
    </button>
  );
}
