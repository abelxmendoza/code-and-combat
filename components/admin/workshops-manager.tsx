'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { upsertGroupEvent, cancelGroupEvent } from '@/lib/actions/admin-events';
import { toast } from '@/hooks/use-toast';
import { formatPriceCents } from '@/lib/utils';
import type { GroupEvent } from '@/types/domain';

interface FormValues {
  slug: string;
  title: string;
  description: string;
  category: 'code' | 'combat';
  startTime: string;
  durationMinutes: number;
  capacity: number;
  priceCents: number;
  priceUnit: 'session' | 'person';
  deliveryType: 'online' | 'in-person' | 'hybrid';
  location: string;
}

const emptyDefaults: FormValues = {
  slug: '',
  title: '',
  description: '',
  category: 'code',
  startTime: '',
  durationMinutes: 90,
  capacity: 10,
  priceCents: 2500,
  priceUnit: 'person',
  deliveryType: 'online',
  location: '',
};

export function WorkshopsManager({ events }: { events: (GroupEvent & { registeredCount: number })[] }) {
  const [showNewForm, setShowNewForm] = useState(false);
  const router = useRouter();

  async function handleCancel(eventId: string) {
    const result = await cancelGroupEvent(eventId);
    if (!result.success) {
      toast({ title: 'Could not cancel', description: result.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Workshop cancelled', variant: 'success' });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Button type="button" size="sm" onClick={() => setShowNewForm((v) => !v)}>
          {showNewForm ? 'Cancel' : 'Add workshop'}
        </Button>
      </div>

      {showNewForm && (
        <div className="card mb-8">
          <WorkshopForm defaultValues={emptyDefaults} onSaved={() => setShowNewForm(false)} />
        </div>
      )}

      <div className="space-y-3">
        {events.map((event) => (
          <div key={event.id} className="card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cb-bone">{event.title}</span>
                  <Badge variant={event.category}>{event.category}</Badge>
                  {event.status !== 'scheduled' && <Badge variant="warning">{event.status}</Badge>}
                </div>
                <p className="text-mono text-sm text-cb-gray">
                  {new Date(event.start_time).toLocaleString()} · {event.registeredCount}/{event.capacity} registered ·{' '}
                  {formatPriceCents(event.price_cents)}
                  {event.price_unit === 'person' ? '/person' : ''}
                </p>
              </div>
              {event.status === 'scheduled' && (
                <Button type="button" size="sm" variant="destructive" onClick={() => handleCancel(event.id)}>
                  Cancel workshop
                </Button>
              )}
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="text-cb-gray">No workshops scheduled yet.</p>}
      </div>
    </div>
  );
}

function WorkshopForm({ defaultValues, onSaved }: { defaultValues: FormValues; onSaved: () => void }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({ defaultValues });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const result = await upsertGroupEvent({
      ...values,
      durationMinutes: Number(values.durationMinutes),
      capacity: Number(values.capacity),
      priceCents: Number(values.priceCents),
      startTime: new Date(values.startTime).toISOString(),
    });
    if (!result.success) {
      setServerError(result.error ?? 'Could not save.');
      return;
    }
    toast({ title: 'Workshop saved', variant: 'success' });
    router.refresh();
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register('title')} />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" {...register('slug')} />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register('description')} />
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
            <option value="person">Per person</option>
            <option value="session">Per session</option>
          </select>
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-4">
        <div>
          <Label htmlFor="startTime">Start time</Label>
          <Input id="startTime" type="datetime-local" {...register('startTime')} />
        </div>
        <div>
          <Label htmlFor="durationMinutes">Duration (min)</Label>
          <Input id="durationMinutes" type="number" {...register('durationMinutes', { valueAsNumber: true })} />
        </div>
        <div>
          <Label htmlFor="capacity">Capacity</Label>
          <Input id="capacity" type="number" {...register('capacity', { valueAsNumber: true })} />
        </div>
        <div>
          <Label htmlFor="priceCents">Price (cents)</Label>
          <Input id="priceCents" type="number" {...register('priceCents', { valueAsNumber: true })} />
        </div>
      </div>
      <div>
        <Label htmlFor="location">Location (optional)</Label>
        <Input id="location" {...register('location')} />
      </div>
      {serverError && (
        <p role="alert" className="rounded border border-cb-crimson bg-cb-crimson/10 p-3 text-sm text-cb-bone">
          {serverError}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Save workshop'}
      </Button>
    </form>
  );
}
