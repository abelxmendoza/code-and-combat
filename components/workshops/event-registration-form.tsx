'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerForEvent, type EventRegistrationConfirmation } from '@/lib/actions/events';

const schema = z.object({
  clientName: z.string().trim().min(2, 'Enter your full name.').max(100),
  clientEmail: z.string().trim().email('Enter a valid email address.'),
  clientPhone: z.string().trim().max(20).optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

export function EventRegistrationForm({ eventId, isFull }: { eventId: string; isFull: boolean }) {
  const [result, setResult] = useState<EventRegistrationConfirmation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setError(null);
    const response = await registerForEvent({ eventId, ...values });
    if (!response.success || !response.data) {
      setError(response.error ?? 'Unable to register.');
      return;
    }
    setResult(response.data);
  }

  if (result) {
    return (
      <div role="status" className="space-y-2">
        <p className="text-sm text-cb-electric">
          {result.status === 'confirmed' ? 'You’re registered!' : 'You’re on the waitlist — we’ll email you if a spot opens up.'}
        </p>
        <a
          href={`/manage/event/${result.registrationId}?token=${result.managementToken}`}
          className="text-sm text-cb-bone underline hover:text-cb-crimson"
        >
          Manage this registration
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      <div>
        <Label htmlFor={`name-${eventId}`}>Full name</Label>
        <Input id={`name-${eventId}`} autoComplete="name" {...register('clientName')} />
        {errors.clientName && <p className="mt-1 text-sm text-cb-crimson">{errors.clientName.message}</p>}
      </div>
      <div>
        <Label htmlFor={`email-${eventId}`}>Email</Label>
        <Input id={`email-${eventId}`} type="email" autoComplete="email" {...register('clientEmail')} />
        {errors.clientEmail && <p className="mt-1 text-sm text-cb-crimson">{errors.clientEmail.message}</p>}
      </div>
      {error && <p role="alert" className="text-sm text-cb-crimson">{error}</p>}
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? 'Registering…' : isFull ? 'Join waitlist' : 'Register'}
      </Button>
    </form>
  );
}
