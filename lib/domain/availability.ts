import { utcToZonedTime } from 'date-fns-tz';
import { addDays, addMinutes } from 'date-fns';
import type { ServiceCategory } from '@/types/database';

/** Midnight UTC on the calendar day containing `date`, independent of the
 * host process's local timezone (unlike date-fns' startOfDay/addDays). */
function utcStartOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

/**
 * Pure, framework-free availability engine. This is a read-side MIRROR of
 * the source of truth in supabase/migrations/0008_functions.sql
 * (is_within_availability + book_appointment) — it's what renders the
 * calendar UI, but the actual booking write is re-validated from scratch by
 * that Postgres function, so a client can never trust a slot shown here.
 *
 * Precedence (matches the SQL exactly): hard block > false override >
 * true override > recurring rule > unavailable.
 */

export interface AvailabilityRuleInput {
  dayOfWeek: number; // 0 = Sunday, matches Postgres extract(dow)
  startTime: string; // 'HH:mm' local business time
  endTime: string;
  category: ServiceCategory | null;
  active: boolean;
}

export interface AvailabilityOverrideInput {
  date: string; // 'yyyy-MM-dd'
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface CalendarBlockInput {
  startTime: Date;
  endTime: Date;
}

export interface ExistingAppointmentInput {
  serviceId: string;
  startTime: Date;
  endTime: Date;
  bufferMinutes: number;
  capacity: number;
  participantCount: number;
}

export interface AvailabilityQuery {
  serviceId: string;
  category: ServiceCategory;
  durationMinutes: number;
  maxParticipants: number;
  businessTimezone: string;
  minNoticeHours: number;
  bookingWindowDays: number;
  slotGranularityMinutes?: number; // default 30
  rangeStart: Date;
  rangeEnd: Date;
  rules: AvailabilityRuleInput[];
  overrides: AvailabilityOverrideInput[];
  blocks: CalendarBlockInput[];
  existingAppointments: ExistingAppointmentInput[];
  now?: Date;
}

export interface AvailableSlot {
  startTime: Date;
  endTime: Date;
  capacity: number;
  remainingCapacity: number;
  isGroupSlot: boolean;
}

// IMPORTANT: date-fns-tz v2's utcToZonedTime shifts the instant and then
// writes the target-zone wall-clock value back using the HOST's *local*
// Date setters (not UTC setters). Its result must therefore be read back
// with local getters (getHours/getDate/...), not UTC getters — reading UTC
// getters only happens to work if the host process itself runs in UTC, and
// silently cancels out (i.e. returns the *input* unchanged) whenever the
// host timezone matches the target timezone. Local getters are correct
// regardless of the host's own timezone.
function toLocalParts(date: Date, timezone: string) {
  const zoned = utcToZonedTime(date, timezone);
  return {
    dateKey: `${zoned.getFullYear()}-${String(zoned.getMonth() + 1).padStart(2, '0')}-${String(
      zoned.getDate(),
    ).padStart(2, '0')}`,
    dayOfWeek: zoned.getDay(),
    minutesOfDay: zoned.getHours() * 60 + zoned.getMinutes(),
  };
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/** Mirrors public.is_within_availability() precedence exactly. */
export function isWithinRecurringAvailability(
  candidateStart: Date,
  candidateEnd: Date,
  category: ServiceCategory,
  timezone: string,
  rules: AvailabilityRuleInput[],
  overrides: AvailabilityOverrideInput[],
): boolean {
  const startParts = toLocalParts(candidateStart, timezone);
  const endParts = toLocalParts(candidateEnd, timezone);

  if (startParts.dateKey !== endParts.dateKey) return false; // no crossing midnight

  const dayOverrides = overrides.filter((o) => o.date === startParts.dateKey);

  const blockedByOverride = dayOverrides.some(
    (o) =>
      !o.isAvailable &&
      rangesOverlap(startParts.minutesOfDay, endParts.minutesOfDay, timeToMinutes(o.startTime), timeToMinutes(o.endTime)),
  );
  if (blockedByOverride) return false;

  const allowedByOverride = dayOverrides.some(
    (o) =>
      o.isAvailable &&
      timeToMinutes(o.startTime) <= startParts.minutesOfDay &&
      timeToMinutes(o.endTime) >= endParts.minutesOfDay,
  );
  if (allowedByOverride) return true;

  return rules.some(
    (r) =>
      r.active &&
      r.dayOfWeek === startParts.dayOfWeek &&
      (r.category === null || r.category === category) &&
      timeToMinutes(r.startTime) <= startParts.minutesOfDay &&
      timeToMinutes(r.endTime) >= endParts.minutesOfDay,
  );
}

function isBlocked(candidateStart: Date, candidateEnd: Date, blocks: CalendarBlockInput[]): boolean {
  return blocks.some((b) => candidateStart < b.endTime && candidateEnd > b.startTime);
}

/**
 * Finds the existing appointment (if any) occupying the exact same start
 * time for the same service — the only case where a new booking can join
 * an existing row instead of needing a brand-new, non-overlapping slot.
 */
function findJoinableAppointment(
  candidateStart: Date,
  serviceId: string,
  existingAppointments: ExistingAppointmentInput[],
): ExistingAppointmentInput | undefined {
  return existingAppointments.find(
    (a) => a.serviceId === serviceId && a.startTime.getTime() === candidateStart.getTime(),
  );
}

function overlapsAnyAppointment(
  candidateStart: Date,
  candidateEnd: Date,
  existingAppointments: ExistingAppointmentInput[],
  excludeJoinable: ExistingAppointmentInput | undefined,
): boolean {
  return existingAppointments.some((a) => {
    if (a === excludeJoinable) return false;
    const blockedEnd = addMinutes(a.endTime, a.bufferMinutes);
    return candidateStart < blockedEnd && candidateEnd > a.startTime;
  });
}

/** Generates every bookable slot for a service across the given range. */
export function generateAvailableSlots(query: AvailabilityQuery): AvailableSlot[] {
  const {
    serviceId,
    category,
    durationMinutes,
    maxParticipants,
    businessTimezone,
    minNoticeHours,
    bookingWindowDays,
    slotGranularityMinutes = 30,
    rangeStart,
    rangeEnd,
    rules,
    overrides,
    blocks,
    existingAppointments,
  } = query;

  const now = query.now ?? new Date();
  const earliestBookable = addMinutes(now, minNoticeHours * 60);
  const latestBookable = addDays(now, bookingWindowDays);

  const slots: AvailableSlot[] = [];
  let cursor = utcStartOfDay(rangeStart);
  const effectiveEnd = rangeEnd < latestBookable ? rangeEnd : latestBookable;

  while (cursor <= effectiveEnd) {
    for (let minutes = 0; minutes < 24 * 60; minutes += slotGranularityMinutes) {
      const candidateStart = addMinutes(cursor, minutes);
      const candidateEnd = addMinutes(candidateStart, durationMinutes);

      if (candidateStart < earliestBookable || candidateStart > latestBookable) continue;
      if (isBlocked(candidateStart, candidateEnd, blocks)) continue;
      if (!isWithinRecurringAvailability(candidateStart, candidateEnd, category, businessTimezone, rules, overrides)) {
        continue;
      }

      const joinable = maxParticipants > 1 ? findJoinableAppointment(candidateStart, serviceId, existingAppointments) : undefined;

      if (joinable) {
        const remaining = joinable.capacity - joinable.participantCount;
        if (remaining > 0) {
          slots.push({
            startTime: candidateStart,
            endTime: candidateEnd,
            capacity: joinable.capacity,
            remainingCapacity: remaining,
            isGroupSlot: true,
          });
        }
        continue;
      }

      if (overlapsAnyAppointment(candidateStart, candidateEnd, existingAppointments, joinable)) continue;

      slots.push({
        startTime: candidateStart,
        endTime: candidateEnd,
        capacity: maxParticipants,
        remainingCapacity: maxParticipants,
        isGroupSlot: maxParticipants > 1,
      });
    }
    cursor = addUtcDays(cursor, 1);
  }

  return slots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

/** Groups a flat slot list by local calendar date, for a day-by-day picker UI. */
export function groupSlotsByLocalDate(slots: AvailableSlot[], timezone: string): Map<string, AvailableSlot[]> {
  const grouped = new Map<string, AvailableSlot[]>();
  for (const slot of slots) {
    const { dateKey } = toLocalParts(slot.startTime, timezone);
    const existing = grouped.get(dateKey) ?? [];
    existing.push(slot);
    grouped.set(dateKey, existing);
  }
  return grouped;
}
