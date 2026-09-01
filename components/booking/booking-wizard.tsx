'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateBookingDraft, setWizardStep, resetBookingDraft, setBookingSubmitting, setBookingError } from '@/store/bookingSlice';
import { getClientTimezone } from '@/lib/timezone';
import { submitBooking, type BookingConfirmation } from '@/lib/actions/booking';
import { toast } from '@/hooks/use-toast';
import { WizardProgress } from './wizard-progress';
import { CategoryStep } from './steps/category-step';
import { ServiceStep } from './steps/service-step';
import { DateTimeStep } from './steps/datetime-step';
import { DetailsStep, type DetailsFormValues } from './steps/details-step';
import { ReviewStep } from './steps/review-step';
import { ConfirmedStep } from './steps/confirmed-step';
import type { AvailableSlotDto, BookableService, DeliveryType, ServiceCategory } from '@/types/domain';

export function BookingWizard({
  services,
  initialCategory,
  initialServiceSlug,
}: {
  services: BookableService[];
  initialCategory?: ServiceCategory;
  initialServiceSlug?: string;
}) {
  const dispatch = useAppDispatch();
  const step = useAppSelector((s) => s.booking.step);
  const draft = useAppSelector((s) => s.booking.draft);
  const isSubmitting = useAppSelector((s) => s.booking.isSubmitting);
  const error = useAppSelector((s) => s.booking.error);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  // Seed from ?category= / ?service= once, without clobbering later steps.
  useEffect(() => {
    const initialService = initialServiceSlug ? services.find((s) => s.slug === initialServiceSlug) : undefined;
    if (initialService) {
      dispatch(
        updateBookingDraft({
          category: initialService.category,
          serviceId: initialService.id,
          deliveryType: initialService.deliveryType === 'hybrid' ? 'online' : initialService.deliveryType,
          timezone: getClientTimezone(),
        }),
      );
      dispatch(setWizardStep('datetime'));
    } else if (initialCategory) {
      dispatch(updateBookingDraft({ category: initialCategory, timezone: getClientTimezone() }));
      dispatch(setWizardStep('service'));
    } else {
      dispatch(updateBookingDraft({ timezone: getClientTimezone() }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedService = services.find((s) => s.id === draft.serviceId);

  async function handleFinalSubmit() {
    if (!selectedService || !draft.startTime || !draft.clientEmail || !draft.clientName) return;
    dispatch(setBookingSubmitting(true));
    dispatch(setBookingError(undefined));

    const result = await submitBooking({
      serviceId: selectedService.id,
      deliveryType: draft.deliveryType ?? selectedService.deliveryType,
      startTime: draft.startTime,
      clientName: draft.clientName,
      clientEmail: draft.clientEmail,
      clientPhone: draft.clientPhone || '',
      notes: draft.notes || '',
      timezone: draft.timezone ?? getClientTimezone(),
      waiverAccepted: draft.waiverAccepted ?? false,
    });

    dispatch(setBookingSubmitting(false));

    if (!result.success || !result.data) {
      dispatch(setBookingError(result.error ?? 'Something went wrong.'));
      toast({ title: 'Booking failed', description: result.error, variant: 'destructive' });
      return;
    }

    setConfirmation(result.data);
    dispatch(setWizardStep('confirmed'));
    toast({ title: 'Booking confirmed', description: `Reference ${result.data.bookingReference}`, variant: 'success' });
  }

  return (
    <div>
      <WizardProgress current={step} />

      {step === 'category' && (
        <CategoryStep
          onSelect={(category) => {
            dispatch(updateBookingDraft({ category, serviceId: undefined }));
            dispatch(setWizardStep('service'));
          }}
        />
      )}

      {step === 'service' && draft.category && (
        <ServiceStep
          services={services}
          category={draft.category}
          selectedServiceId={draft.serviceId}
          onSelect={(service) => {
            dispatch(
              updateBookingDraft({
                serviceId: service.id,
                deliveryType: service.deliveryType === 'hybrid' ? 'online' : service.deliveryType,
                startTime: undefined,
              }),
            );
            dispatch(setWizardStep('datetime'));
          }}
          onBack={() => dispatch(setWizardStep('category'))}
        />
      )}

      {step === 'datetime' && selectedService && (
        <DateTimeStep
          service={selectedService}
          deliveryType={(draft.deliveryType ?? selectedService.deliveryType) as DeliveryType}
          onDeliveryTypeChange={(deliveryType) => dispatch(updateBookingDraft({ deliveryType }))}
          selectedStartTime={draft.startTime}
          onSelectSlot={(slot: AvailableSlotDto) =>
            dispatch(updateBookingDraft({ startTime: slot.startTime, endTime: slot.endTime }))
          }
          onBack={() => dispatch(setWizardStep('service'))}
          onNext={() => dispatch(setWizardStep('details'))}
        />
      )}

      {step === 'details' && selectedService && (
        <DetailsStep
          service={selectedService}
          defaultValues={{
            clientName: draft.clientName ?? '',
            clientEmail: draft.clientEmail ?? '',
            clientPhone: draft.clientPhone ?? '',
            notes: draft.notes ?? '',
            waiverAccepted: draft.waiverAccepted ?? false,
          }}
          onSubmit={(values: DetailsFormValues) => {
            dispatch(updateBookingDraft(values));
            dispatch(setWizardStep('review'));
          }}
          onBack={() => dispatch(setWizardStep('datetime'))}
        />
      )}

      {step === 'review' && selectedService && (
        <ReviewStep
          service={selectedService}
          draft={draft}
          isSubmitting={isSubmitting}
          error={error}
          onSubmit={handleFinalSubmit}
          onBack={() => dispatch(setWizardStep('details'))}
        />
      )}

      {step === 'confirmed' && selectedService && confirmation && (
        <ConfirmedStep
          service={selectedService}
          confirmation={confirmation}
          timezone={draft.timezone ?? getClientTimezone()}
          onBookAnother={() => {
            setConfirmation(null);
            dispatch(resetBookingDraft());
          }}
        />
      )}
    </div>
  );
}
