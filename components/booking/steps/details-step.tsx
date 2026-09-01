'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { BookableService } from '@/types/domain';

const detailsSchema = z.object({
  clientName: z.string().trim().min(2, 'Enter your full name.').max(100),
  clientEmail: z.string().trim().email('Enter a valid email address.'),
  clientPhone: z.string().trim().max(20).optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  waiverAccepted: z.boolean().optional(),
});

export type DetailsFormValues = z.infer<typeof detailsSchema>;

export function DetailsStep({
  service,
  defaultValues,
  onSubmit,
  onBack,
}: {
  service: BookableService;
  defaultValues: Partial<DetailsFormValues>;
  onSubmit: (values: DetailsFormValues) => void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues,
  });

  const waiverAccepted = watch('waiverAccepted');

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2 className="mb-2 text-cb-bone">Your details</h2>
      <p className="mb-8 text-cb-gray">We’ll use this to confirm your session and send your booking link.</p>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="clientName">Full name</Label>
          <Input id="clientName" autoComplete="name" {...register('clientName')} aria-invalid={!!errors.clientName} />
          {errors.clientName && <p className="mt-1 text-sm text-cb-crimson">{errors.clientName.message}</p>}
        </div>
        <div>
          <Label htmlFor="clientEmail">Email</Label>
          <Input
            id="clientEmail"
            type="email"
            autoComplete="email"
            {...register('clientEmail')}
            aria-invalid={!!errors.clientEmail}
          />
          {errors.clientEmail && <p className="mt-1 text-sm text-cb-crimson">{errors.clientEmail.message}</p>}
        </div>
        <div>
          <Label htmlFor="clientPhone">Phone (optional)</Label>
          <Input id="clientPhone" type="tel" autoComplete="tel" {...register('clientPhone')} />
        </div>
      </div>

      <div className="mt-6">
        <Label htmlFor="notes">Notes for Abel (optional)</Label>
        <Textarea id="notes" placeholder="Anything useful to know ahead of the session." {...register('notes')} />
      </div>

      {service.preparationInstructions && (
        <div className="mt-6 rounded border border-cb-steel bg-cb-dark p-4 text-sm text-cb-gray">
          <p className="mb-1 font-semibold text-cb-bone">Before your session</p>
          <p>{service.preparationInstructions}</p>
        </div>
      )}

      {service.requiresWaiver && (
        <div className="mt-6 rounded border border-cb-amber/40 bg-cb-dark p-4">
          <p className="mb-3 text-sm text-cb-gray">
            This is a beginner-focused martial arts session, not medical advice. Participation requires accepting
            our waiver — you assume the risks of physical training and confirm you have no condition that would
            make participation unsafe.
          </p>
          <div className="flex items-start gap-3">
            <Checkbox
              id="waiverAccepted"
              checked={waiverAccepted ?? false}
              onCheckedChange={(checked) => setValue('waiverAccepted', checked === true)}
            />
            <Label htmlFor="waiverAccepted" className="font-normal normal-case">
              I have read and accept the waiver, and understand this session is beginner-focused and not medical
              advice.
            </Label>
          </div>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={service.requiresWaiver && !waiverAccepted}>
          Continue to review
        </Button>
      </div>
    </form>
  );
}
