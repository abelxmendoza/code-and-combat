'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateBookingSettings } from '@/lib/actions/admin-availability';
import { toast } from '@/hooks/use-toast';
import type { BookingSettings } from '@/types/domain';

interface FormValues {
  minNoticeHours: number;
  bookingWindowDays: number;
  cancellationNoticeHours: number;
  rescheduleNoticeHours: number;
}

export function SettingsForm({ settings }: { settings: BookingSettings }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      minNoticeHours: settings.min_notice_hours,
      bookingWindowDays: settings.booking_window_days,
      cancellationNoticeHours: settings.cancellation_notice_hours,
      rescheduleNoticeHours: settings.reschedule_notice_hours,
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const result = await updateBookingSettings({
      minNoticeHours: Number(values.minNoticeHours),
      bookingWindowDays: Number(values.bookingWindowDays),
      cancellationNoticeHours: Number(values.cancellationNoticeHours),
      rescheduleNoticeHours: Number(values.rescheduleNoticeHours),
    });
    if (!result.success) {
      setServerError(result.error ?? 'Could not save.');
      return;
    }
    toast({ title: 'Settings saved', variant: 'success' });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card max-w-xl space-y-6">
      <div>
        <Label htmlFor="minNoticeHours">Minimum booking notice (hours)</Label>
        <Input id="minNoticeHours" type="number" {...register('minNoticeHours', { valueAsNumber: true })} />
      </div>
      <div>
        <Label htmlFor="bookingWindowDays">Booking window (days ahead)</Label>
        <Input id="bookingWindowDays" type="number" {...register('bookingWindowDays', { valueAsNumber: true })} />
      </div>
      <div>
        <Label htmlFor="cancellationNoticeHours">Cancellation notice window (hours)</Label>
        <Input id="cancellationNoticeHours" type="number" {...register('cancellationNoticeHours', { valueAsNumber: true })} />
      </div>
      <div>
        <Label htmlFor="rescheduleNoticeHours">Reschedule notice window (hours)</Label>
        <Input id="rescheduleNoticeHours" type="number" {...register('rescheduleNoticeHours', { valueAsNumber: true })} />
      </div>
      <p className="text-sm text-cb-gray">
        Business timezone ({settings.business_timezone}) and per-session buffer time are configured on each service
        under Services.
      </p>
      {serverError && (
        <p role="alert" className="rounded border border-cb-danger bg-cb-danger/10 p-3 text-sm text-cb-bone">
          {serverError}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Save settings'}
      </Button>
    </form>
  );
}
