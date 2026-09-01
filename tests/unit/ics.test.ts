import { describe, it, expect } from 'vitest';
import { generateIcsEvent } from '@/lib/domain/ics';

describe('generateIcsEvent', () => {
  const base = {
    uid: 'abc-123@codeandcombat.abel',
    title: 'Coding Tutoring',
    startTime: new Date('2026-09-08T00:00:00Z'),
    endTime: new Date('2026-09-08T01:00:00Z'),
  };

  it('produces a valid VCALENDAR/VEVENT structure with CRLF line endings', () => {
    const ics = generateIcsEvent(base);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('\r\n');
  });

  it('formats start/end times as UTC basic ISO (no separators)', () => {
    const ics = generateIcsEvent(base);
    expect(ics).toContain('DTSTART:20260908T000000Z');
    expect(ics).toContain('DTEND:20260908T010000Z');
  });

  it('escapes commas, semicolons, and newlines in text fields', () => {
    const ics = generateIcsEvent({
      ...base,
      description: 'Bring: a laptop, water; and enthusiasm.\nSee you there.',
    });
    expect(ics).toContain('DESCRIPTION:Bring: a laptop\\, water\\; and enthusiasm.\\nSee you there.');
  });

  it('omits optional fields when not provided', () => {
    const ics = generateIcsEvent(base);
    expect(ics).not.toContain('LOCATION:');
    expect(ics).not.toContain('ORGANIZER:');
  });

  it('includes location and organizer when provided', () => {
    const ics = generateIcsEvent({ ...base, location: 'Video call', organizerEmail: 'abel@example.com' });
    expect(ics).toContain('LOCATION:Video call');
    expect(ics).toContain('ORGANIZER:mailto:abel@example.com');
  });
});
