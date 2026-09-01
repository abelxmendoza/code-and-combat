/** Minimal RFC 5545 .ics generator — no external dependency needed. */

export interface IcsEventInput {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date; // UTC
  endTime: Date; // UTC
  organizerEmail?: string;
}

function toIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function generateIcsEvent(event: IcsEventInput): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Code and Combat by Abel//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(event.startTime)}`,
    `DTEND:${toIcsUtc(event.endTime)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
  ];

  if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  if (event.organizerEmail) lines.push(`ORGANIZER:mailto:${event.organizerEmail}`);

  lines.push('STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR');

  // RFC 5545 requires CRLF line endings.
  return lines.join('\r\n');
}
