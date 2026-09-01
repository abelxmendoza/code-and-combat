import { describe, it, expect } from 'vitest';
import { formatTimeInTimezone, zonedWallTimeToUtc } from '@/lib/timezone';

describe('timezone conversion', () => {
  it('converts a UTC instant to Pacific wall-clock text', () => {
    const utc = new Date('2026-09-08T00:00:00Z'); // 17:00 PT Monday (PDT, UTC-7)
    expect(formatTimeInTimezone(utc, 'America/Los_Angeles', 'yyyy-MM-dd HH:mm')).toBe(
      '2026-09-07 17:00',
    );
  });

  it('converts the same instant differently for a different zone', () => {
    const utc = new Date('2026-09-08T00:00:00Z');
    expect(formatTimeInTimezone(utc, 'America/New_York', 'yyyy-MM-dd HH:mm')).toBe(
      '2026-09-07 20:00',
    );
  });

  it('parses a local wall-clock string in a given zone back to the correct UTC instant', () => {
    const utc = zonedWallTimeToUtc('2026-09-07 17:00:00', 'America/Los_Angeles');
    expect(utc.toISOString()).toBe('2026-09-08T00:00:00.000Z');
  });

  it('round-trips through both conversions', () => {
    const original = new Date('2026-01-15T18:30:00Z');
    const local = formatTimeInTimezone(original, 'America/Los_Angeles', "yyyy-MM-dd'T'HH:mm:ss");
    const roundTripped = zonedWallTimeToUtc(local, 'America/Los_Angeles');
    expect(roundTripped.toISOString()).toBe(original.toISOString());
  });
});
