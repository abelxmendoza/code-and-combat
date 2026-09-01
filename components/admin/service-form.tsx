'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { serviceSchema, type ServiceFormData } from '@/lib/validation';
import { upsertService } from '@/lib/actions/admin-services';
import { toast } from '@/hooks/use-toast';

export function ServiceForm({
  defaultValues,
  serviceId,
  onSaved,
}: {
  defaultValues: ServiceFormData;
  serviceId?: string;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormData>({ resolver: zodResolver(serviceSchema), defaultValues });

  const requiresWaiver = watch('requiresWaiver');
  const active = watch('active');

  async function onSubmit(values: ServiceFormData) {
    setServerError(null);
    const result = await upsertService(values, serviceId);
    if (!result.success) {
      setServerError(result.error ?? 'Could not save.');
      return;
    }
    toast({ title: 'Service saved', variant: 'success' });
    router.refresh();
    onSaved?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="mt-1 text-sm text-cb-danger">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" {...register('slug')} />
          {errors.slug && <p className="mt-1 text-sm text-cb-danger">{errors.slug.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="shortDescription">Short description</Label>
        <Input id="shortDescription" {...register('shortDescription')} />
        {errors.shortDescription && <p className="mt-1 text-sm text-cb-danger">{errors.shortDescription.message}</p>}
      </div>

      <div>
        <Label htmlFor="fullDescription">Full description</Label>
        <Textarea id="fullDescription" {...register('fullDescription')} />
        {errors.fullDescription && <p className="mt-1 text-sm text-cb-danger">{errors.fullDescription.message}</p>}
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <Label htmlFor="category">Category</Label>
          <select id="category" className="input-field w-full" {...register('category')}>
            <option value="code">Code</option>
            <option value="combat">Combat</option>
          </select>
        </div>
        <div>
          <Label htmlFor="deliveryType">Delivery</Label>
          <select id="deliveryType" className="input-field w-full" {...register('deliveryType')}>
            <option value="online">Online</option>
            <option value="in-person">In-person</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div>
          <Label htmlFor="priceUnit">Price unit</Label>
          <select id="priceUnit" className="input-field w-full" {...register('priceUnit')}>
            <option value="session">Per session</option>
            <option value="person">Per person</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-4">
        <div>
          <Label htmlFor="durationMinutes">Duration (min)</Label>
          <Input id="durationMinutes" type="number" {...register('durationMinutes', { valueAsNumber: true })} />
        </div>
        <div>
          <Label htmlFor="bufferMinutes">Buffer (min)</Label>
          <Input id="bufferMinutes" type="number" {...register('bufferMinutes', { valueAsNumber: true })} />
        </div>
        <div>
          <Label htmlFor="priceCents">Price (cents)</Label>
          <Input id="priceCents" type="number" {...register('priceCents', { valueAsNumber: true })} />
        </div>
        <div>
          <Label htmlFor="maxParticipants">Max participants</Label>
          <Input id="maxParticipants" type="number" {...register('maxParticipants', { valueAsNumber: true })} />
        </div>
      </div>

      <div>
        <Label htmlFor="preparationInstructions">Preparation instructions (optional)</Label>
        <Textarea id="preparationInstructions" {...register('preparationInstructions')} />
      </div>

      <div>
        <Label htmlFor="imageUrl">Image URL (optional)</Label>
        <Input id="imageUrl" {...register('imageUrl')} />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Checkbox id="requiresWaiver" checked={requiresWaiver} onCheckedChange={(c) => setValue('requiresWaiver', c === true)} />
          <Label htmlFor="requiresWaiver" className="font-normal normal-case">
            Requires waiver
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="active" checked={active} onCheckedChange={(c) => setValue('active', c === true)} />
          <Label htmlFor="active" className="font-normal normal-case">
            Active
          </Label>
        </div>
      </div>

      {serverError && (
        <p role="alert" className="rounded border border-cb-danger bg-cb-danger/10 p-3 text-sm text-cb-bone">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Save service'}
      </Button>
    </form>
  );
}
