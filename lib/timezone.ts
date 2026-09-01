import { formatInTimeZone, zonedTimeToUtc } from 'date-fns-tz';
import { formatISO, parseISO } from 'date-fns';

// NOTE ON date-fns-tz v2 FOOTGUN: `utcToZonedTime` shifts an instant and
// then writes the target-zone wall-clock value back using the HOST
// process's *local* Date setters. Reading its result back correctly
// requires local getters (getHours/getDate/...), not UTC getters — get
// that wrong and it silently no-ops whenever the host TZ happens to match
// the target TZ (exactly what happened once already in this codebase; see
// lib/domain/availability.ts). To avoid that trap entirely, this module
// sticks to `formatInTimeZone` (formatting) and `zonedTimeToUtc` (parsing),
// which are correct and host-timezone-independent by construction.

export const getClientTimezone = (): string => {
  if (typeof window === 'undefined') return 'UTC';
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/** Formats a UTC instant as wall-clock text in the given IANA timezone. */
export const formatTimeInTimezone = (
  date: Date,
  timezone: string,
  formatStr: string = 'MMM d, yyyy h:mm a zzz',
): string => {
  return formatInTimeZone(date, timezone, formatStr);
};

/**
 * Converts a local wall-clock string (e.g. from a date/time picker, with NO
 * offset — '2026-09-07 17:00:00' or '2026-09-07T17:00:00') interpreted in
 * `timezone` into the correct UTC Date for storage/API calls.
 */
export const zonedWallTimeToUtc = (dateString: string, timezone: string): Date => {
  return zonedTimeToUtc(dateString, timezone);
};

export const getUTCString = (date: Date): string => {
  return formatISO(date, { representation: 'complete' });
};

export const parseUtcIso = (dateString: string): Date => parseISO(dateString);
