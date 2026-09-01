'use client';

import { Button } from '@/components/ui/button';
import { formatTimeInTimezone } from '@/lib/timezone';
import { formatPriceCents } from '@/lib/utils';
import type { BookableService } from '@/types/domain';
import type { BookingDraft } from '@/store/bookingSlice';

export function ReviewStep({
  service,
  draft,
  isSubmitting,
  error,
  onSubmit,
  onBack,
}: {
  service: BookableService;
  draft: BookingDraft;
  isSubmitting: boolean;
  error?: string;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const timezone = draft.timezone ?? 'UTC';

  return (
    <div>
      <h2 className="mb-2 text-cb-bone">Review your booking</h2>
      <p className="mb-8 text-cb-gray">Confirm the details below before booking.</p>

      <dl className="card grid gap-4 sm:grid-cols-2">
        <ReviewItem label="Service" value={service.name} />
        <ReviewItem label="Delivery" value={draft.deliveryType ?? service.deliveryType} />
        <ReviewItem
          label="Date & time"
          value={draft.startTime ? formatTimeInTimezone(new Date(draft.startTime), timezone, 'EEEE, MMM d · h:mm a zzz') : '—'}
        />
        <ReviewItem label="Duration" value={`${service.durationMinutes} minutes`} />
        <ReviewItem
          label="Price"
          value={`${formatPriceCents(service.priceCents)}${service.priceUnit === 'person' ? ' / person' : ''}`}
        />
        <ReviewItem label="Timezone" value={timezone} />
        <ReviewItem label="Name" value={draft.clientName ?? '—'} />
        <ReviewItem label="Email" value={draft.clientEmail ?? '—'} />
        {draft.notes && <ReviewItem label="Notes" value={draft.notes} full />}
      </dl>

      {service.category === 'combat' && (
        <p className="mt-4 text-sm text-cb-gray">
          Reminder: this session is beginner-focused and not medical advice. A signed waiver is required before
          participation.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-6 rounded border border-cb-crimson bg-cb-crimson/10 p-3 text-sm text-cb-bone">
          {error}
        </p>
      )}

      <div className="mt-8 flex gap-3">
        <Button type="button" variant="secondary" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Booking…' : 'Confirm booking'}
        </Button>
      </div>
    </div>
  );
}

function ReviewItem({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : undefined}>
      <dt className="text-mono text-cb-gray">{label}</dt>
      <dd className="text-cb-bone">{value}</dd>
    </div>
  );
}
