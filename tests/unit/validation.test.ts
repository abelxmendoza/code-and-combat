import { describe, it, expect } from 'vitest';
import { bookingSchema, contactSchema } from '@/lib/validation';

describe('bookingSchema', () => {
  const validInput = {
    serviceId: '11111111-1111-1111-1111-111111111111',
    deliveryType: 'online' as const,
    startTime: '2026-09-08T00:00:00.000Z',
    clientName: 'Jane Doe',
    clientEmail: 'jane@example.com',
    clientPhone: '',
    notes: '',
    timezone: 'America/Los_Angeles',
    waiverAccepted: false,
  };

  it('accepts a valid booking submission', () => {
    const result = bookingSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = bookingSchema.safeParse({ ...validInput, clientEmail: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects a name shorter than 2 characters', () => {
    const result = bookingSchema.safeParse({ ...validInput, clientName: 'J' });
    expect(result.success).toBe(false);
  });

  it('rejects a non-uuid serviceId', () => {
    const result = bookingSchema.safeParse({ ...validInput, serviceId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('silently strips client-supplied price/duration fields instead of trusting them', () => {
    // The server (book_appointment RPC) always recomputes price and duration
    // from the service row — this schema doesn't even define those fields,
    // so a malicious payload including them can never influence a booking.
    const result = bookingSchema.safeParse({
      ...validInput,
      priceCents: 1,
      durationMinutes: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('priceCents');
      expect(result.data).not.toHaveProperty('durationMinutes');
    }
  });
});

describe('contactSchema', () => {
  const validInput = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    inquiryType: 'general' as const,
    preferredContactMethod: 'email' as const,
    message: 'Hello, I have a question about your services.',
    companyWebsite: '',
    formRenderedAt: Date.now(),
  };

  it('accepts a valid contact submission', () => {
    expect(contactSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects a message that is too short', () => {
    const result = contactSchema.safeParse({ ...validInput, message: 'hi' });
    expect(result.success).toBe(false);
  });

  it('accepts a filled honeypot field at the schema level (the action layer decides how to respond to it)', () => {
    // lib/actions/contact.ts checks companyWebsite itself and silently
    // no-ops instead of inserting — that behavior must not be short-circuited
    // by the schema rejecting the submission outright.
    const result = contactSchema.safeParse({ ...validInput, companyWebsite: 'http://spam.example' });
    expect(result.success).toBe(true);
  });
});
