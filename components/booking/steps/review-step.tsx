'use client';

import { Button } from '@/components/ui/button';
import { PoliciesNotice } from '@/components/booking/policies-notice';

export interface ReviewItemData {
  label: string;
  value: string;
  full?: boolean;
}

export function ReviewStep({
  title,
  items,
  waiverNotice,
  isSubmitting,
  error,
  submitLabel,
  submittingLabel,
  onSubmit,
  onBack,
}: {
  title: string;
  items: ReviewItemData[];
  waiverNotice?: string;
  isSubmitting: boolean;
  error?: string;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <h2 className="mb-2 text-cb-bone">{title}</h2>
      <p className="mb-8 text-cb-gray">Confirm the details below before continuing.</p>

      <dl className="card mb-6 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <ReviewItem key={item.label} {...item} />
        ))}
      </dl>

      <div className="mb-6">
        <PoliciesNotice />
      </div>

      {waiverNotice && <p className="mb-4 text-sm text-cb-gray">{waiverNotice}</p>}

      {error && (
        <p role="alert" className="mb-6 rounded border border-cb-crimson bg-cb-crimson/10 p-3 text-sm text-cb-bone">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </div>
  );
}

function ReviewItem({ label, value, full }: ReviewItemData) {
  return (
    <div className={full ? 'sm:col-span-2' : undefined}>
      <dt className="text-mono text-cb-gray">{label}</dt>
      <dd className="text-cb-bone">{value}</dd>
    </div>
  );
}
