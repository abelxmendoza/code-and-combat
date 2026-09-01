'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatPriceCents } from '@/lib/utils';
import { formatTimeInTimezone, getClientTimezone } from '@/lib/timezone';
import type { WorkshopDto } from '@/lib/repository';

export function WorkshopStep({
  workshops,
  selectedWorkshopId,
  onSelect,
  onBack,
  onNext,
}: {
  workshops: WorkshopDto[];
  selectedWorkshopId?: string;
  onSelect: (workshopId: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const timezone = getClientTimezone();

  return (
    <div>
      <h2 className="mb-2 text-cb-bone">Choose a workshop</h2>
      <p className="mb-8 text-cb-gray">Times shown in your timezone: <span className="text-mono text-cb-bone">{timezone}</span></p>

      {workshops.length === 0 ? (
        <p className="text-cb-gray">No upcoming workshops in this category right now.</p>
      ) : (
        <div className="space-y-4">
          {workshops.map((workshop) => {
            const seatsRemaining = Math.max(workshop.capacity - workshop.confirmedCount, 0);
            const isFull = seatsRemaining === 0;
            const isSelected = selectedWorkshopId === workshop.id;
            return (
              <button
                key={workshop.id}
                type="button"
                onClick={() => onSelect(workshop.id)}
                className={cn(
                  'card w-full text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cb-crimson',
                  isSelected ? 'border-cb-crimson' : 'hover:border-cb-gray',
                )}
                aria-pressed={isSelected}
              >
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-bold text-cb-bone">{workshop.title}</h3>
                  <Badge variant={isFull ? 'warning' : 'success'}>{isFull ? 'Waitlist only' : `${seatsRemaining} seats left`}</Badge>
                </div>
                <p className="mb-3 text-sm text-cb-gray">{workshop.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-mono text-cb-gray">
                  <span>{formatTimeInTimezone(new Date(workshop.startTime), timezone, 'EEE MMM d, h:mm a zzz')}</span>
                  <span aria-hidden="true">·</span>
                  <span>{workshop.durationMinutes} min</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {formatPriceCents(workshop.priceCents)}
                    {workshop.priceUnit === 'person' ? '/person' : ''}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Capacity {workshop.capacity} · {workshop.deliveryType}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onNext} disabled={!selectedWorkshopId}>
          Continue
        </Button>
      </div>
    </div>
  );
}
