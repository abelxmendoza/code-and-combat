'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatPriceCents } from '@/lib/utils';
import type { BookableService, ServiceCategory } from '@/types/domain';

export function ServiceStep({
  services,
  category,
  selectedServiceId,
  onSelect,
  onBack,
}: {
  services: BookableService[];
  category: ServiceCategory;
  selectedServiceId?: string;
  onSelect: (service: BookableService) => void;
  onBack: () => void;
}) {
  const filtered = services.filter((s) => s.category === category);

  return (
    <div>
      <h2 className="mb-2 text-cb-bone">Choose a {category === 'code' ? 'Code' : 'Combat'} service</h2>
      <p className="mb-8 text-cb-gray">Duration, price, and delivery method are shown on each card.</p>

      {filtered.length === 0 ? (
        <p className="text-cb-gray">No active services in this category right now. Check back soon.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelect(service)}
              className={cn(
                'card flex flex-col items-start gap-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cb-crimson',
                selectedServiceId === service.id ? 'border-cb-crimson' : 'hover:border-cb-gray',
              )}
              aria-pressed={selectedServiceId === service.id}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <h3 className="text-lg font-bold text-cb-bone">{service.name}</h3>
                <Badge variant={service.category}>{service.category}</Badge>
              </div>
              <p className="text-sm text-cb-gray">{service.shortDescription}</p>
              <div className="mt-auto flex flex-wrap items-center gap-3 text-mono text-cb-gray">
                <span>{service.durationMinutes} min</span>
                <span aria-hidden="true">·</span>
                <span>
                  {formatPriceCents(service.priceCents)}
                  {service.priceUnit === 'person' ? ' / person' : ''}
                </span>
                <span aria-hidden="true">·</span>
                <span>{service.deliveryType}</span>
                {service.maxParticipants > 1 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>up to {service.maxParticipants}</span>
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}
