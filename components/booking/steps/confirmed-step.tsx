'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTimeInTimezone } from '@/lib/timezone';
import { formatPriceCents } from '@/lib/utils';
import type { BookableService } from '@/types/domain';
import type { BookingConfirmation } from '@/lib/actions/booking';

export function ConfirmedStep({
  service,
  confirmation,
  timezone,
  onBookAnother,
}: {
  service: BookableService;
  confirmation: BookingConfirmation;
  timezone: string;
  onBookAnother: () => void;
}) {
  const manageUrl = `/manage/${confirmation.appointmentId}?token=${confirmation.managementToken}`;
  const icsUrl = `/api/ics/${confirmation.appointmentId}?token=${confirmation.managementToken}`;

  return (
    <div className="text-center">
      <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-cb-electric" aria-hidden="true" />
      <h2 className="mb-2 text-cb-bone">You’re booked</h2>
      <p className="mb-8 text-cb-gray">
        Confirmation reference <span className="text-mono text-cb-bone">{confirmation.bookingReference}</span> — a copy
        has been sent to your email.
      </p>

      <dl className="card mx-auto grid max-w-md gap-4 text-left">
        <div>
          <dt className="text-mono text-cb-gray">Service</dt>
          <dd className="text-cb-bone">{service.name}</dd>
        </div>
        <div>
          <dt className="text-mono text-cb-gray">When</dt>
          <dd className="text-cb-bone">{formatTimeInTimezone(new Date(confirmation.startTime), timezone, 'EEEE, MMM d · h:mm a zzz')}</dd>
        </div>
        {confirmation.location && (
          <div>
            <dt className="text-mono text-cb-gray">Where</dt>
            <dd className="text-cb-bone">{confirmation.location}</dd>
          </div>
        )}
        <div>
          <dt className="text-mono text-cb-gray">Price</dt>
          <dd className="text-cb-bone">
            {formatPriceCents(confirmation.priceCents)}
            {confirmation.priceUnit === 'person' ? ' / person' : ''}
          </dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild variant="secondary">
          <a href={icsUrl}>Add to calendar (.ics)</a>
        </Button>
        <Button asChild variant="secondary">
          <Link href={manageUrl}>Manage this booking</Link>
        </Button>
        <Button type="button" onClick={onBookAnother}>
          Book another session
        </Button>
      </div>

      <p className="mx-auto mt-6 max-w-md text-sm text-cb-gray">
        Save your manage link — it lets you reschedule or cancel without creating an account.
      </p>
    </div>
  );
}
