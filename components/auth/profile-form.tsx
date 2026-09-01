'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { profileSchema, type ProfileFormData } from '@/lib/validation';
import { updateProfile } from '@/lib/actions/profile';
import { getClientTimezone } from '@/lib/timezone';
import { toast } from '@/hooks/use-toast';

export function ProfileForm({ defaultValues }: { defaultValues: ProfileFormData }) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({ resolver: zodResolver(profileSchema), defaultValues });

  const [detected, setDetected] = useState(false);

  async function onSubmit(values: ProfileFormData) {
    const result = await updateProfile(values);
    if (!result.success) {
      toast({ title: 'Could not save', description: result.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Profile updated', variant: 'success' });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="card max-w-lg space-y-6">
      <div>
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" autoComplete="name" {...register('fullName')} />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" type="tel" autoComplete="tel" {...register('phone')} />
      </div>
      <div>
        <Label htmlFor="timezone">Timezone</Label>
        <div className="flex gap-2">
          <Input id="timezone" {...register('timezone')} aria-invalid={!!errors.timezone} />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setValue('timezone', getClientTimezone());
              setDetected(true);
            }}
          >
            Detect
          </Button>
        </div>
        {detected && <p className="mt-1 text-sm text-cb-gray">Detected from your browser.</p>}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  );
}
