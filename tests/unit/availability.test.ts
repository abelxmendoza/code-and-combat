import { describe, it, expect } from 'vitest';
import {
  generateAvailableSlots,
  isWithinRecurringAvailability,
  groupSlotsByLocalDate,
  type AvailabilityRuleInput,
  type AvailabilityOverrideInput,
  type ExistingAppointmentInput,
} from '@/lib/domain/availability';

// 2026-09-07 is a Monday; America/Los_Angeles is UTC-7 (PDT) in September.
const TZ = 'America/Los_Angeles';
const MONDAY_RULE: AvailabilityRuleInput = {
  dayOfWeek: 1,
  startTime: '17:00',
  endTime: '21:00',
  category: 'code',
  active: true,
};

function baseQuery(overrides: Partial<Parameters<typeof generateAvailableSlots>[0]> = {}) {
  return {
    serviceId: 'svc-code-1',
    category: 'code' as const,
    durationMinutes: 60,
    maxParticipants: 1,
    businessTimezone: TZ,
    minNoticeHours: 0,
    bookingWindowDays: 365,
    slotGranularityMinutes: 60,
    rangeStart: new Date('2026-09-07T00:00:00Z'),
    rangeEnd: new Date('2026-09-09T00:00:00Z'),
    rules: [MONDAY_RULE],
    overrides: [] as AvailabilityOverrideInput[],
    blocks: [],
    existingAppointments: [] as ExistingAppointmentInput[],
    now: new Date('2026-09-01T00:00:00Z'),
    ...overrides,
  };
}

describe('isWithinRecurringAvailability', () => {
  it('accepts a slot inside the recurring rule window, converted from business timezone to UTC', () => {
    // 17:00 PT Monday = 00:00 UTC Tuesday
    const start = new Date('2026-09-08T00:00:00Z');
    const end = new Date('2026-09-08T01:00:00Z');
    expect(isWithinRecurringAvailability(start, end, 'code', TZ, [MONDAY_RULE], [])).toBe(true);
  });

  it('rejects a slot outside the rule window', () => {
    // 21:30 PT Monday — past the 21:00 cutoff
    const start = new Date('2026-09-08T04:30:00Z');
    const end = new Date('2026-09-08T05:30:00Z');
    expect(isWithinRecurringAvailability(start, end, 'code', TZ, [MONDAY_RULE], [])).toBe(false);
  });

  it('rejects a slot on a day with no matching rule', () => {
    // Tuesday 18:00 PT — rule only covers Monday
    const start = new Date('2026-09-09T01:00:00Z');
    const end = new Date('2026-09-09T02:00:00Z');
    expect(isWithinRecurringAvailability(start, end, 'code', TZ, [MONDAY_RULE], [])).toBe(false);
  });

  it('rejects a category mismatch even if the day/time matches', () => {
    const start = new Date('2026-09-08T00:00:00Z');
    const end = new Date('2026-09-08T01:00:00Z');
    expect(isWithinRecurringAvailability(start, end, 'combat', TZ, [MONDAY_RULE], [])).toBe(false);
  });

  it('a false override removes availability even inside an otherwise valid rule window', () => {
    const start = new Date('2026-09-08T00:00:00Z'); // 17:00 PT Monday
    const end = new Date('2026-09-08T01:00:00Z');
    const override: AvailabilityOverrideInput = {
      date: '2026-09-07',
      startTime: '17:00',
      endTime: '18:00',
      isAvailable: false,
    };
    expect(isWithinRecurringAvailability(start, end, 'code', TZ, [MONDAY_RULE], [override])).toBe(false);
  });

  it('a true override adds availability outside any recurring rule', () => {
    // Wednesday, no rule covers it at all
    const start = new Date('2026-09-10T00:00:00Z'); // 17:00 PT Wednesday
    const end = new Date('2026-09-10T01:00:00Z');
    const override: AvailabilityOverrideInput = {
      date: '2026-09-09',
      startTime: '16:00',
      endTime: '19:00',
      isAvailable: true,
    };
    expect(isWithinRecurringAvailability(start, end, 'code', TZ, [MONDAY_RULE], [override])).toBe(true);
  });

  it('rejects a slot that would cross midnight in the business timezone', () => {
    const rule: AvailabilityRuleInput = { ...MONDAY_RULE, startTime: '23:00', endTime: '23:59' };
    const start = new Date('2026-09-08T06:00:00Z'); // 23:00 PT Monday
    const end = new Date('2026-09-08T08:00:00Z'); // crosses into Tuesday local time
    expect(isWithinRecurringAvailability(start, end, 'code', TZ, [rule], [])).toBe(false);
  });
});

describe('generateAvailableSlots', () => {
  it('generates one slot per hour across the rule window', () => {
    const slots = generateAvailableSlots(baseQuery());
    // 17:00, 18:00, 19:00, 20:00 PT — 20:00+60min = 21:00 is the last valid start
    expect(slots).toHaveLength(4);
    expect(slots[0].startTime.toISOString()).toBe('2026-09-08T00:00:00.000Z');
    expect(slots.at(-1)!.startTime.toISOString()).toBe('2026-09-08T03:00:00.000Z');
  });

  it('honors the minimum notice window', () => {
    const slots = generateAvailableSlots(
      baseQuery({ now: new Date('2026-09-08T00:00:00Z'), minNoticeHours: 3 }),
    );
    // Notice pushes the earliest bookable start to 03:00 UTC Tuesday — only
    // the 20:00 PT (03:00 UTC) slot remains.
    expect(slots).toHaveLength(1);
    expect(slots[0].startTime.toISOString()).toBe('2026-09-08T03:00:00.000Z');
  });

  it('excludes slots that overlap an existing appointment plus its buffer', () => {
    const existing: ExistingAppointmentInput = {
      serviceId: 'other-service',
      startTime: new Date('2026-09-08T01:00:00Z'), // 18:00 PT
      endTime: new Date('2026-09-08T02:00:00Z'), // 19:00 PT
      bufferMinutes: 30,
      capacity: 1,
      participantCount: 1,
    };
    const slots = generateAvailableSlots(baseQuery({ existingAppointments: [existing] }));
    // 17:00 survives (ends before 18:00 booking starts).
    // 18:00 and 19:00 are blocked by the booking + its 30-min buffer (blocked until 19:30 PT).
    // 20:00 survives (starts after the buffered block ends).
    const starts = slots.map((s) => s.startTime.toISOString());
    expect(starts).toEqual(['2026-09-08T00:00:00.000Z', '2026-09-08T03:00:00.000Z']);
  });

  it('excludes slots that fall inside a hard calendar block', () => {
    const slots = generateAvailableSlots(
      baseQuery({
        blocks: [{ startTime: new Date('2026-09-08T00:00:00Z'), endTime: new Date('2026-09-08T02:00:00Z') }],
      }),
    );
    const starts = slots.map((s) => s.startTime.toISOString());
    expect(starts).toEqual(['2026-09-08T02:00:00.000Z', '2026-09-08T03:00:00.000Z']);
  });

  it('lets additional participants join an existing group slot up to capacity', () => {
    const existing: ExistingAppointmentInput = {
      serviceId: 'svc-code-1',
      startTime: new Date('2026-09-08T00:00:00Z'), // 17:00 PT
      endTime: new Date('2026-09-08T01:00:00Z'),
      bufferMinutes: 15,
      capacity: 3,
      participantCount: 2,
    };
    const slots = generateAvailableSlots(
      baseQuery({ maxParticipants: 3, existingAppointments: [existing] }),
    );
    const joinable = slots.find((s) => s.startTime.toISOString() === '2026-09-08T00:00:00.000Z');
    expect(joinable).toBeDefined();
    expect(joinable!.isGroupSlot).toBe(true);
    expect(joinable!.remainingCapacity).toBe(1);
  });

  it('hides a group slot once it is at full capacity', () => {
    const existing: ExistingAppointmentInput = {
      serviceId: 'svc-code-1',
      startTime: new Date('2026-09-08T00:00:00Z'),
      endTime: new Date('2026-09-08T01:00:00Z'),
      bufferMinutes: 15,
      capacity: 2,
      participantCount: 2,
    };
    const slots = generateAvailableSlots(
      baseQuery({ maxParticipants: 2, existingAppointments: [existing] }),
    );
    const full = slots.find((s) => s.startTime.toISOString() === '2026-09-08T00:00:00.000Z');
    expect(full).toBeUndefined();
  });
});

describe('groupSlotsByLocalDate', () => {
  it('buckets slots by their local calendar date, not UTC date', () => {
    const slots = generateAvailableSlots(baseQuery());
    const grouped = groupSlotsByLocalDate(slots, TZ);
    // All four Monday-evening PT slots land on 2026-09-07 locally, even
    // though their UTC timestamps fall on 2026-09-08.
    expect(grouped.size).toBe(1);
    expect(grouped.get('2026-09-07')).toHaveLength(4);
  });
});
