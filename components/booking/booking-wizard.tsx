'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  updateBookingDraft,
  setWizardStep,
  resetBookingDraft,
  setBookingSubmitting,
  setBookingError,
  type OfferType,
} from '@/store/bookingSlice';
import { getClientTimezone, formatTimeInTimezone } from '@/lib/timezone';
import { submitBooking, type BookingConfirmation } from '@/lib/actions/booking';
import { registerForEvent, type EventRegistrationConfirmation } from '@/lib/actions/events';
import { purchasePackage, type PackagePurchaseConfirmation } from '@/lib/actions/packages';
import { formatPriceCents } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { WizardProgress, type ProgressStep } from './wizard-progress';
import { CategoryStep } from './steps/category-step';
import { OfferTypeStep } from './steps/offer-type-step';
import { WorkshopStep } from './steps/workshop-step';
import { DateTimeStep } from './steps/datetime-step';
import { DetailsStep, type DetailsFormValues } from './steps/details-step';
import { ReviewStep, type ReviewItemData } from './steps/review-step';
import { ConfirmedStep, type ConfirmedAction } from './steps/confirmed-step';
import type { AvailableSlotDto, BookableService, DeliveryType, ServiceCategory } from '@/types/domain';
import type { WorkshopDto } from '@/lib/repository';

type Confirmation =
  | { type: 'private'; data: BookingConfirmation }
  | { type: 'workshop'; data: EventRegistrationConfirmation }
  | { type: 'package'; data: PackagePurchaseConfirmation };

const PRIVATE_STEPS: ProgressStep[] = [
  { key: 'category', label: 'Category' },
  { key: 'offerType', label: 'Session Type' },
  { key: 'datetime', label: 'Date & Time' },
  { key: 'details', label: 'Your Details' },
  { key: 'review', label: 'Review' },
];
const WORKSHOP_STEPS: ProgressStep[] = [
  { key: 'category', label: 'Category' },
  { key: 'offerType', label: 'Session Type' },
  { key: 'workshop', label: 'Workshop' },
  { key: 'details', label: 'Your Details' },
  { key: 'review', label: 'Review' },
];
const PACKAGE_STEPS: ProgressStep[] = [
  { key: 'category', label: 'Category' },
  { key: 'offerType', label: 'Session Type' },
  { key: 'details', label: 'Your Details' },
  { key: 'review', label: 'Review' },
];

export function BookingWizard({
  services,
  workshops,
  initialCategory,
  initialServiceSlug,
}: {
  services: BookableService[];
  workshops: WorkshopDto[];
  initialCategory?: ServiceCategory;
  initialServiceSlug?: string;
}) {
  const dispatch = useAppDispatch();
  const step = useAppSelector((s) => s.booking.step);
  const draft = useAppSelector((s) => s.booking.draft);
  const isSubmitting = useAppSelector((s) => s.booking.isSubmitting);
  const error = useAppSelector((s) => s.booking.error);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  useEffect(() => {
    const initialService = initialServiceSlug ? services.find((s) => s.slug === initialServiceSlug) : undefined;
    if (initialService) {
      dispatch(
        updateBookingDraft({
          category: initialService.category,
          offerType: 'private',
          serviceId: initialService.id,
          deliveryType: initialService.deliveryType === 'hybrid' ? 'online' : initialService.deliveryType,
          timezone: getClientTimezone(),
        }),
      );
      dispatch(setWizardStep('datetime'));
    } else if (initialCategory) {
      dispatch(updateBookingDraft({ category: initialCategory, timezone: getClientTimezone() }));
      dispatch(setWizardStep('offerType'));
    } else {
      dispatch(updateBookingDraft({ timezone: getClientTimezone() }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const privateService = useMemo(
    () => services.find((s) => s.category === draft.category && s.maxParticipants === 1),
    [services, draft.category],
  );
  const categoryWorkshops = useMemo(
    () => workshops.filter((w) => w.category === draft.category),
    [workshops, draft.category],
  );
  const selectedWorkshop = useMemo(() => workshops.find((w) => w.id === draft.workshopId), [workshops, draft.workshopId]);

  const progressSteps = draft.offerType === 'workshop' ? WORKSHOP_STEPS : draft.offerType === 'package' ? PACKAGE_STEPS : PRIVATE_STEPS;
  const timezone = draft.timezone ?? getClientTimezone();

  function handleOfferType(offerType: OfferType) {
    if (offerType === 'private' && privateService) {
      dispatch(
        updateBookingDraft({
          offerType,
          serviceId: privateService.id,
          deliveryType: privateService.deliveryType === 'hybrid' ? 'online' : privateService.deliveryType,
        }),
      );
      dispatch(setWizardStep('datetime'));
    } else if (offerType === 'workshop') {
      dispatch(updateBookingDraft({ offerType }));
      dispatch(setWizardStep('workshop'));
    } else {
      dispatch(updateBookingDraft({ offerType }));
      dispatch(setWizardStep('details'));
    }
  }

  async function handleFinalSubmit() {
    if (!draft.category || !draft.offerType || !draft.clientEmail || !draft.clientName || !draft.clientPhone) return;
    dispatch(setBookingSubmitting(true));
    dispatch(setBookingError(undefined));

    if (draft.offerType === 'private') {
      if (!draft.serviceId || !draft.startTime) return;
      const result = await submitBooking({
        serviceId: draft.serviceId,
        deliveryType: draft.deliveryType ?? privateService?.deliveryType,
        startTime: draft.startTime,
        clientName: draft.clientName,
        clientEmail: draft.clientEmail,
        clientPhone: draft.clientPhone,
        notes: draft.notes || '',
        timezone,
        waiverAccepted: draft.waiverAccepted ?? false,
      });
      dispatch(setBookingSubmitting(false));
      if (!result.success || !result.data) {
        dispatch(setBookingError(result.error ?? 'Something went wrong.'));
        toast({ title: 'Booking failed', description: result.error, variant: 'destructive' });
        return;
      }
      setConfirmation({ type: 'private', data: result.data });
      dispatch(setWizardStep('confirmed'));
      toast({ title: 'Booking confirmed', description: `Reference ${result.data.bookingReference}`, variant: 'success' });
      return;
    }

    if (draft.offerType === 'workshop') {
      if (!draft.workshopId) return;
      const result = await registerForEvent({
        eventId: draft.workshopId,
        clientName: draft.clientName,
        clientEmail: draft.clientEmail,
        clientPhone: draft.clientPhone,
      });
      dispatch(setBookingSubmitting(false));
      if (!result.success || !result.data) {
        dispatch(setBookingError(result.error ?? 'Something went wrong.'));
        toast({ title: 'Registration failed', description: result.error, variant: 'destructive' });
        return;
      }
      setConfirmation({ type: 'workshop', data: result.data });
      dispatch(setWizardStep('confirmed'));
      toast({ title: 'Registration confirmed', variant: 'success' });
      return;
    }

    if (draft.offerType === 'package') {
      const result = await purchasePackage({
        packageType: draft.category,
        clientName: draft.clientName,
        clientEmail: draft.clientEmail,
        clientPhone: draft.clientPhone,
        notes: draft.notes || '',
      });
      dispatch(setBookingSubmitting(false));
      if (!result.success || !result.data) {
        dispatch(setBookingError(result.error ?? 'Something went wrong.'));
        toast({ title: 'Could not start package purchase', description: result.error, variant: 'destructive' });
        return;
      }
      setConfirmation({ type: 'package', data: result.data });
      dispatch(setWizardStep('confirmed'));
      toast({ title: 'Package request received', variant: 'success' });
    }
  }

  const reviewItems: ReviewItemData[] = useMemo(() => {
    if (draft.offerType === 'private' && privateService) {
      return [
        { label: 'Service', value: privateService.name },
        { label: 'Delivery', value: draft.deliveryType ?? privateService.deliveryType },
        {
          label: 'Date & time',
          value: draft.startTime ? formatTimeInTimezone(new Date(draft.startTime), timezone, 'EEEE, MMM d · h:mm a zzz') : '—',
        },
        { label: 'Duration', value: `${privateService.durationMinutes} minutes` },
        { label: 'Price', value: formatPriceCents(privateService.priceCents) },
        { label: 'Timezone', value: timezone },
        { label: 'Name', value: draft.clientName ?? '—' },
        { label: 'Email', value: draft.clientEmail ?? '—' },
        { label: 'Phone', value: draft.clientPhone ?? '—' },
        ...(draft.notes ? [{ label: 'Notes', value: draft.notes, full: true }] : []),
      ];
    }
    if (draft.offerType === 'workshop' && selectedWorkshop) {
      return [
        { label: 'Workshop', value: selectedWorkshop.title },
        { label: 'Date & time', value: formatTimeInTimezone(new Date(selectedWorkshop.startTime), timezone, 'EEEE, MMM d · h:mm a zzz') },
        { label: 'Duration', value: `${selectedWorkshop.durationMinutes} minutes` },
        { label: 'Price', value: `${formatPriceCents(selectedWorkshop.priceCents)} / person` },
        { label: 'Timezone', value: timezone },
        { label: 'Name', value: draft.clientName ?? '—' },
        { label: 'Email', value: draft.clientEmail ?? '—' },
        { label: 'Phone', value: draft.clientPhone ?? '—' },
      ];
    }
    if (draft.offerType === 'package') {
      const label = draft.category === 'code' ? 'Coding & Tech Tutoring' : 'Private Striking Training';
      return [
        { label: 'Package', value: `Four-Session Package — ${label}` },
        { label: 'Sessions', value: '4 × 60 minutes' },
        { label: 'Price', value: formatPriceCents(18000) },
        { label: 'Name', value: draft.clientName ?? '—' },
        { label: 'Email', value: draft.clientEmail ?? '—' },
        { label: 'Phone', value: draft.clientPhone ?? '—' },
        ...(draft.notes ? [{ label: 'Notes', value: draft.notes, full: true }] : []),
      ];
    }
    return [];
  }, [draft, privateService, selectedWorkshop, timezone]);

  return (
    <div>
      <WizardProgress current={step} steps={progressSteps} />

      {step === 'category' && (
        <CategoryStep
          onSelect={(category) => {
            dispatch(updateBookingDraft({ category, offerType: undefined, serviceId: undefined, workshopId: undefined }));
            dispatch(setWizardStep('offerType'));
          }}
        />
      )}

      {step === 'offerType' && draft.category && (
        <OfferTypeStep
          category={draft.category}
          privateService={privateService}
          onSelect={handleOfferType}
          onBack={() => dispatch(setWizardStep('category'))}
        />
      )}

      {step === 'workshop' && (
        <WorkshopStep
          workshops={categoryWorkshops}
          selectedWorkshopId={draft.workshopId}
          onSelect={(workshopId) => dispatch(updateBookingDraft({ workshopId }))}
          onBack={() => dispatch(setWizardStep('offerType'))}
          onNext={() => dispatch(setWizardStep('details'))}
        />
      )}

      {step === 'datetime' && privateService && (
        <DateTimeStep
          service={privateService}
          deliveryType={(draft.deliveryType ?? privateService.deliveryType) as DeliveryType}
          onDeliveryTypeChange={(deliveryType) => dispatch(updateBookingDraft({ deliveryType }))}
          selectedStartTime={draft.startTime}
          onSelectSlot={(slot: AvailableSlotDto) => dispatch(updateBookingDraft({ startTime: slot.startTime, endTime: slot.endTime }))}
          onBack={() => dispatch(setWizardStep('offerType'))}
          onNext={() => dispatch(setWizardStep('details'))}
        />
      )}

      {step === 'details' && draft.offerType && (
        <DetailsStep
          category={draft.category ?? 'code'}
          requiresWaiver={draft.offerType === 'private' ? (privateService?.requiresWaiver ?? false) : false}
          preparationInstructions={draft.offerType === 'private' ? privateService?.preparationInstructions : undefined}
          notePrompt={
            draft.offerType === 'package'
              ? 'Anything to share before your first session? (optional)'
              : draft.category === 'code'
                ? 'Briefly, what do you want help with?'
                : 'Anything Abel should know before your session? (optional)'
          }
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
          onBack={() => dispatch(setWizardStep(draft.offerType === 'private' ? 'datetime' : draft.offerType === 'workshop' ? 'workshop' : 'offerType'))}
        />
      )}

      {step === 'review' && draft.offerType && (
        <ReviewStep
          title={draft.offerType === 'package' ? 'Review your package request' : 'Review your booking'}
          items={reviewItems}
          waiverNotice={
            (draft.offerType === 'private' && privateService?.category === 'combat') || (draft.offerType === 'workshop' && draft.category === 'combat')
              ? 'Reminder: this is beginner-focused instruction, not medical advice.'
              : undefined
          }
          isSubmitting={isSubmitting}
          error={error}
          submitLabel={draft.offerType === 'package' ? 'Submit package request' : draft.offerType === 'workshop' ? 'Confirm registration' : 'Confirm booking'}
          submittingLabel={draft.offerType === 'package' ? 'Submitting…' : draft.offerType === 'workshop' ? 'Registering…' : 'Booking…'}
          onSubmit={handleFinalSubmit}
          onBack={() => dispatch(setWizardStep('details'))}
        />
      )}

      {step === 'confirmed' && confirmation && (
        <ConfirmedOutcome
          confirmation={confirmation}
          timezone={timezone}
          onBookAnother={() => {
            setConfirmation(null);
            dispatch(resetBookingDraft());
          }}
        />
      )}
    </div>
  );
}

function ConfirmedOutcome({
  confirmation,
  timezone,
  onBookAnother,
}: {
  confirmation: Confirmation;
  timezone: string;
  onBookAnother: () => void;
}) {
  if (confirmation.type === 'private' && confirmation.data) {
    const data = confirmation.data;
    const manageUrl = `/manage/${data.appointmentId}?token=${data.managementToken}`;
    const icsUrl = `/api/ics/${data.appointmentId}?token=${data.managementToken}`;
    const actions: ConfirmedAction[] = [
      { label: 'Add to calendar (.ics)', href: icsUrl },
      { label: 'Manage this booking', href: manageUrl },
    ];
    return (
      <ConfirmedStep
        heading="You’re booked"
        reference={data.bookingReference}
        message="a copy has been sent to your email."
        items={[
          { label: 'When', value: formatTimeInTimezone(new Date(data.startTime), timezone, 'EEEE, MMM d · h:mm a zzz') },
          ...(data.location ? [{ label: 'Where', value: data.location }] : []),
          { label: 'Price', value: formatPriceCents(data.priceCents) },
        ]}
        footnote="Save your manage link — it lets you reschedule or cancel without creating an account."
        actions={actions}
        onBookAnother={onBookAnother}
      />
    );
  }

  if (confirmation.type === 'workshop' && confirmation.data) {
    const data = confirmation.data;
    const manageUrl = `/manage/event/${data.registrationId}?token=${data.managementToken}`;
    return (
      <ConfirmedStep
        heading={data.status === 'confirmed' ? 'You’re registered' : 'You’re on the waitlist'}
        reference={data.registrationId.slice(0, 8).toUpperCase()}
        message={data.status === 'confirmed' ? 'a confirmation has been sent to your email.' : 'we’ll email you if a spot opens up.'}
        items={[{ label: 'Status', value: data.status }]}
        footnote="Save your manage link to cancel your registration if plans change."
        actions={[{ label: 'Manage this registration', href: manageUrl }]}
        onBookAnother={onBookAnother}
      />
    );
  }

  if (confirmation.type === 'package' && confirmation.data) {
    const data = confirmation.data;
    return (
      <ConfirmedStep
        heading="Package request received"
        reference={data.packageReference}
        message="this is not a payment confirmation."
        items={[
          { label: 'Sessions', value: `${data.totalSessions} sessions` },
          { label: 'Price', value: formatPriceCents(data.priceCents) },
          { label: 'Status', value: 'Pending payment' },
        ]}
        footnote="Payment integration is coming soon. Abel will follow up by email to arrange payment and your first session."
        actions={[]}
        onBookAnother={onBookAnother}
      />
    );
  }

  return null;
}
