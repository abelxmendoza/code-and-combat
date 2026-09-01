'use client';

import { useMemo, useState } from 'react';
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
import { cancelBookingByToken, rescheduleBookingByToken, type ManageableAppointment } from '@/lib/actions/booking';
import { getClientTimezone, formatTimeInTimezone } from '@/lib/timezone';
import { formatPriceCents } from '@/lib/utils';
import { groupSlotsByLocalDate, type AvailableSlot } from '@/lib/domain/availability';
import { toast } from '@/hooks/use-toast';
import type { AvailableSlotDto } from '@/types/domain';

export function ManageBookingClient({ appointment, token }: { appointment: ManageableAppointment; token: string }) {
  const [current, setCurrent] = useState(appointment);
  const [showReschedule, setShowReschedule] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const timezone = useMemo(() => getClientTimezone(), []);

  const isActive = current.status === 'pending' || current.status === 'confirmed';

  async function handleCancel() {
    setIsCancelling(true);
    const result = await cancelBookingByToken({ appointmentId: current.id, token, clientEmail: current.clientEmail });
    setIsCancelling(false);
    if (!result.success) {
      toast({ title: 'Could not cancel', description: result.error, variant: 'destructive' });
      return;
    }
    setCurrent((prev) => ({ ...prev, status: 'cancelled_by_client' }));
    toast({ title: 'Booking cancelled', variant: 'success' });
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-cb-bone">{current.serviceName}</h2>
          <Badge variant={current.status === 'confirmed' ? 'success' : current.status.startsWith('cancelled') ? 'danger' : 'neutral'}>
            {current.status.replace(/_/g, ' ')}
          </Badge>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Item label="Reference" value={current.bookingReference} />
          <Item label="When" value={formatTimeInTimezone(new Date(current.startTime), timezone, 'EEEE, MMM d · h:mm a zzz')} />
          <Item label="Delivery" value={current.deliveryType} />
          {current.location && <Item label="Where" value={current.location} />}
          <Item label="Price" value={`${formatPriceCents(current.priceCents)}${current.priceUnit === 'person' ? ' / person' : ''}`} />
        </dl>
      </div>

      {isActive && (
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <a href={`/api/ics/${current.id}?token=${token}`}>Add to calendar (.ics)</a>
          </Button>

          {!current.isGroupSession && (
            <Button type="button" variant="secondary" onClick={() => setShowReschedule((v) => !v)}>
              {showReschedule ? 'Cancel reschedule' : 'Reschedule'}
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive">
                Cancel booking
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                <AlertDialogDescription>
                  This can’t be undone. Cancellation policy applies — check your confirmation email for details.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep booking</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancel} disabled={isCancelling}>
                  {isCancelling ? 'Cancelling…' : 'Yes, cancel it'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {showReschedule && isActive && !current.isGroupSession && (
        <RescheduleSlotPicker
          appointment={current}
          token={token}
          timezone={timezone}
          onRescheduled={(startTime, endTime) => {
            setCurrent((prev) => ({ ...prev, startTime, endTime }));
            setShowReschedule(false);
          }}
        />
      )}

      {!isActive && <p className="text-cb-gray">This booking is {current.status.replace(/_/g, ' ')}.</p>}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-mono text-cb-gray">{label}</dt>
      <dd className="text-cb-bone">{value}</dd>
    </div>
  );
}

function RescheduleSlotPicker({
  appointment,
  token,
  timezone,
  onRescheduled,
}: {
  appointment: ManageableAppointment;
  token: string;
  timezone: string;
  onRescheduled: (startTime: string, endTime: string) => void;
}) {
  const [slots, setSlots] = useState<AvailableSlotDto[] | null>(null);
  const [selected, setSelected] = useState<AvailableSlotDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useMemo(() => {
    const rangeStart = new Date();
    const rangeEnd = new Date(rangeStart.getTime() + 21 * 24 * 60 * 60 * 1000);
    const params = new URLSearchParams({
      serviceId: appointment.serviceId,
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString(),
    });
    fetch(`/api/availability?${params.toString()}`)
      .then((res) => res.json())
      .then((data: { slots: AvailableSlotDto[] }) => setSlots(data.slots))
      .catch(() => setSlots([]));
    // fetch once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    if (!slots) return new Map<string, AvailableSlot[]>();
    return groupSlotsByLocalDate(
      slots.map((s) => ({ ...s, startTime: new Date(s.startTime), endTime: new Date(s.endTime) })),
      timezone,
    );
  }, [slots, timezone]);

  async function confirmReschedule() {
    if (!selected) return;
    setIsSubmitting(true);
    const result = await rescheduleBookingByToken({
      appointmentId: appointment.id,
      token,
      newStartTime: selected.startTime,
    });
    setIsSubmitting(false);
    if (!result.success || !result.data) {
      toast({ title: 'Could not reschedule', description: result.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Booking rescheduled', variant: 'success' });
    onRescheduled(result.data.startTime, result.data.endTime);
  }

  return (
    <div className="card">
      <h3 className="mb-4 text-cb-bone">Pick a new time</h3>
      {slots === null && <p className="text-cb-gray">Loading availability…</p>}
      {slots !== null && grouped.size === 0 && <p className="text-cb-gray">No upcoming availability found.</p>}
      <div className="max-h-80 space-y-4 overflow-y-auto">
        {Array.from(grouped.entries()).map(([dateKey, daySlots]) => (
          <div key={dateKey}>
            <p className="mb-2 text-mono text-cb-gray">{formatTimeInTimezone(daySlots[0].startTime, timezone, 'EEE MMM d')}</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {daySlots.map((slot) => {
                const isSelected = selected?.startTime === slot.startTime.toISOString();
                return (
                  <button
                    key={slot.startTime.toISOString()}
                    type="button"
                    onClick={() =>
                      setSelected({
                        startTime: slot.startTime.toISOString(),
                        endTime: slot.endTime.toISOString(),
                        capacity: slot.capacity,
                        remainingCapacity: slot.remainingCapacity,
                        isGroupSlot: slot.isGroupSlot,
                      })
                    }
                    className={`rounded border px-3 py-2 text-mono text-sm transition ${
                      isSelected ? 'border-cb-crimson bg-cb-crimson text-cb-black' : 'border-cb-steel text-cb-bone hover:border-cb-gray'
                    }`}
                  >
                    {formatTimeInTimezone(slot.startTime, timezone, 'h:mm a')}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <Button type="button" className="mt-4" onClick={confirmReschedule} disabled={!selected || isSubmitting}>
        {isSubmitting ? 'Rescheduling…' : 'Confirm new time'}
      </Button>
    </div>
  );
}
