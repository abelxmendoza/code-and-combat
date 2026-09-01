'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ServiceForm } from './service-form';
import { toggleServiceActive, softDeleteService } from '@/lib/actions/admin-services';
import { toast } from '@/hooks/use-toast';
import { formatPriceCents } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import type { Service } from '@/types/domain';

export function ServicesManager({ services }: { services: Service[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const router = useRouter();

  async function handleToggleActive(service: Service) {
    const result = await toggleServiceActive(service.id, !service.active);
    if (!result.success) {
      toast({ title: 'Could not update', description: result.error, variant: 'destructive' });
      return;
    }
    toast({ title: service.active ? 'Service deactivated' : 'Service activated', variant: 'success' });
    router.refresh();
  }

  async function handleDelete(service: Service) {
    const result = await softDeleteService(service.id);
    if (!result.success) {
      toast({ title: 'Could not delete', description: result.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Service deleted', variant: 'success' });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Button type="button" size="sm" onClick={() => setShowNewForm((v) => !v)}>
          {showNewForm ? 'Cancel' : 'Add service'}
        </Button>
      </div>

      {showNewForm && (
        <div className="card mb-8">
          <ServiceForm
            defaultValues={{
              slug: '',
              name: '',
              shortDescription: '',
              fullDescription: '',
              category: 'code',
              durationMinutes: 60,
              bufferMinutes: 15,
              priceCents: 5000,
              priceUnit: 'session',
              deliveryType: 'online',
              maxParticipants: 1,
              imageUrl: '',
              preparationInstructions: '',
              requiresWaiver: false,
              active: true,
            }}
            onSaved={() => setShowNewForm(false)}
          />
        </div>
      )}

      <div className="space-y-3">
        {services.map((service) => (
          <div key={service.id} className="card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cb-bone">{service.name}</span>
                  <Badge variant={service.category}>{service.category}</Badge>
                  {!service.active && <Badge variant="warning">inactive</Badge>}
                </div>
                <p className="text-mono text-sm text-cb-gray">
                  {service.duration_minutes} min · {formatPriceCents(service.price_cents)}
                  {service.price_unit === 'person' ? '/person' : ''} · {service.delivery_type}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={() => setExpandedId(expandedId === service.id ? null : service.id)}>
                  {expandedId === service.id ? 'Close' : 'Edit'}
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => handleToggleActive(service)}>
                  {service.active ? 'Deactivate' : 'Activate'}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" size="sm" variant="destructive">
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this service?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This soft-deletes the service — it will disappear from booking but past appointments remain intact.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(service)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {expandedId === service.id && (
              <div className="mt-6 border-t border-cb-steel pt-6">
                <ServiceForm
                  serviceId={service.id}
                  defaultValues={{
                    slug: service.slug,
                    name: service.name,
                    shortDescription: service.short_description,
                    fullDescription: service.full_description,
                    category: service.category,
                    durationMinutes: service.duration_minutes,
                    bufferMinutes: service.buffer_minutes,
                    priceCents: service.price_cents,
                    priceUnit: service.price_unit,
                    deliveryType: service.delivery_type,
                    maxParticipants: service.max_participants,
                    imageUrl: service.image_url ?? '',
                    preparationInstructions: service.preparation_instructions ?? '',
                    requiresWaiver: service.requires_waiver,
                    active: service.active,
                  }}
                  onSaved={() => setExpandedId(null)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
