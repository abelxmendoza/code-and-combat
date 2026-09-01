'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getClientTimezone, formatTimeInTimezone } from '@/lib/timezone';
import { groupSlotsByLocalDate, type AvailableSlot } from '@/lib/domain/availability';
import type { AvailableSlotDto, BookableService, DeliveryType } from '@/types/domain';

const RANGE_DAYS = 21;

export function DateTimeStep({
  service,
  deliveryType,
  onDeliveryTypeChange,
  selectedStartTime,
  onSelectSlot,
  onBack,
  onNext,
}: {
  service: BookableService;
  deliveryType: DeliveryType;
  onDeliveryTypeChange: (type: DeliveryType) => void;
  selectedStartTime?: string;
  onSelectSlot: (slot: AvailableSlotDto) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [slots, setSlots] = useState<AvailableSlotDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const timezone = useMemo(() => getClientTimezone(), []);

  useEffect(() => {
    let cancelled = false;
    setSlots(null);
    setError(null);

    const rangeStart = new Date();
    const rangeEnd = new Date(rangeStart.getTime() + RANGE_DAYS * 24 * 60 * 60 * 1000);
    const params = new URLSearchParams({
      serviceId: service.id,
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString(),
    });

    fetch(`/api/availability?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load availability.');
        return res.json();
      })
      .then((data: { slots: AvailableSlotDto[] }) => {
        if (!cancelled) setSlots(data.slots);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load availability. Please try again.');
      });

    return () => {
      cancelled = true;
    };
  }, [service.id]);

  const grouped = useMemo(() => {
    if (!slots) return new Map<string, AvailableSlot[]>();
    return groupSlotsByLocalDate(
      slots.map((s) => ({ ...s, startTime: new Date(s.startTime), endTime: new Date(s.endTime) })),
      timezone,
    );
  }, [slots, timezone]);

  const dateKeys = useMemo(() => Array.from(grouped.keys()).sort(), [grouped]);

  useEffect(() => {
    if (!selectedDate && dateKeys.length > 0) setSelectedDate(dateKeys[0]);
  }, [dateKeys, selectedDate]);

  const daySlots = selectedDate ? grouped.get(selectedDate) ?? [] : [];

  return (
    <div>
      <h2 className="mb-2 text-cb-bone">Pick a date and time</h2>
      <p className="mb-4 text-cb-gray">
        Showing times in your timezone: <span className="text-mono text-cb-bone">{timezone}</span>
      </p>

      {service.deliveryType === 'hybrid' && (
        <fieldset className="mb-6">
          <legend className="label-text mb-2">Delivery method</legend>
          <div className="flex gap-3">
            {(['online', 'in-person'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onDeliveryTypeChange(type)}
                className={cn(
                  'rounded border px-4 py-2 text-sm capitalize transition',
                  deliveryType === type ? 'border-cb-crimson bg-cb-crimson/10 text-cb-bone' : 'border-cb-steel text-cb-gray hover:text-cb-bone',
                )}
                aria-pressed={deliveryType === type}
              >
                {type}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {error && (
        <p role="alert" className="mb-4 rounded border border-cb-crimson bg-cb-crimson/10 p-3 text-sm text-cb-bone">
          {error}
        </p>
      )}

      {!error && slots === null && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading availability">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-cb-dark" />
          ))}
        </div>
      )}

      {slots !== null && dateKeys.length === 0 && !error && (
        <p className="text-cb-gray">
          No available times in the next {RANGE_DAYS} days. Please check back later or use the contact page.
        </p>
      )}

      {dateKeys.length > 0 && (
        <div>
          <div role="tablist" aria-label="Select a date" className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {dateKeys.map((dateKey) => {
              const first = grouped.get(dateKey)![0];
              const label = formatTimeInTimezone(first.startTime, timezone, 'EEE MMM d');
              return (
                <button
                  key={dateKey}
                  type="button"
                  role="tab"
                  aria-selected={selectedDate === dateKey}
                  onClick={() => setSelectedDate(dateKey)}
                  className={cn(
                    'shrink-0 rounded border px-4 py-2 text-mono text-sm transition',
                    selectedDate === dateKey ? 'border-cb-crimson bg-cb-crimson/10 text-cb-bone' : 'border-cb-steel text-cb-gray hover:text-cb-bone',
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div role="tabpanel" className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {daySlots.map((slot) => {
              const isSelected = selectedStartTime === slot.startTime.toISOString();
              return (
                <button
                  key={slot.startTime.toISOString()}
                  type="button"
                  onClick={() =>
                    onSelectSlot({
                      startTime: slot.startTime.toISOString(),
                      endTime: slot.endTime.toISOString(),
                      capacity: slot.capacity,
                      remainingCapacity: slot.remainingCapacity,
                      isGroupSlot: slot.isGroupSlot,
                    })
                  }
                  className={cn(
                    'rounded border px-3 py-2 text-mono text-sm transition',
                    isSelected ? 'border-cb-crimson bg-cb-crimson text-cb-black' : 'border-cb-steel text-cb-bone hover:border-cb-gray',
                  )}
                  aria-pressed={isSelected}
                >
                  {formatTimeInTimezone(slot.startTime, timezone, 'h:mm a')}
                  {slot.isGroupSlot && (
                    <span className="mt-0.5 block text-[10px] text-cb-gray">{slot.remainingCapacity} left</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onNext} disabled={!selectedStartTime}>
          Continue
        </Button>
      </div>
    </div>
  );
}
