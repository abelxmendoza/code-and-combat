import { z } from 'zod';

// Guest/client booking submission. Price and duration are intentionally
// NOT part of this schema — they are never accepted from the client. The
// server always recomputes them from the service row inside
// book_appointment() (see supabase/migrations/0008_functions.sql).
export const bookingSchema = z
  .object({
    serviceId: z.string().uuid('Select a service to continue.'),
    deliveryType: z.enum(['online', 'in-person', 'hybrid']),
    startTime: z.string().datetime({ message: 'Select an available time slot.' }),
    clientName: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100),
    clientEmail: z.string().trim().email('Enter a valid email address.'),
    clientPhone: z
      .string()
      .trim()
      .max(20)
      .optional()
      .or(z.literal('')),
    notes: z.string().trim().max(500).optional().or(z.literal('')),
    timezone: z.string().min(1),
    waiverAccepted: z.boolean().default(false),
  })
  .refine((data) => data.timezone.length > 0, { message: 'Timezone is required.', path: ['timezone'] });

export type BookingFormData = z.infer<typeof bookingSchema>;

export const rescheduleSchema = z.object({
  appointmentId: z.string().uuid(),
  token: z.string().length(64),
  newStartTime: z.string().datetime(),
});
export type RescheduleFormData = z.infer<typeof rescheduleSchema>;

export const cancelSchema = z.object({
  appointmentId: z.string().uuid(),
  token: z.string().length(64),
  clientEmail: z.string().trim().email(),
});
export type CancelFormData = z.infer<typeof cancelSchema>;

export const eventRegistrationSchema = z.object({
  eventId: z.string().uuid(),
  clientName: z.string().trim().min(2).max(100),
  clientEmail: z.string().trim().email(),
  clientPhone: z.string().trim().max(20).optional().or(z.literal('')),
});
export type EventRegistrationFormData = z.infer<typeof eventRegistrationSchema>;

// Contact form
export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100),
  email: z.string().trim().email('Enter a valid email address.'),
  inquiryType: z.enum(['code', 'combat', 'workshop', 'development', 'general']).default('general'),
  preferredContactMethod: z.enum(['email', 'phone']).default('email'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters.').max(2000),
  // Honeypot — real visitors never fill this in; bots that auto-fill every
  // field do. Deliberately unrestricted here (any string is valid input) so
  // a filled-in honeypot reaches lib/actions/contact.ts, which is what
  // decides how to respond to it — rejecting it at the schema level would
  // surface a validation error instead of the intended silent no-op.
  companyWebsite: z.string().max(200).optional().or(z.literal('')),
  formRenderedAt: z.number(),
});
export type ContactFormData = z.infer<typeof contactSchema>;

// Service validation (admin)
export const serviceSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only.'),
  name: z.string().trim().min(1).max(200),
  shortDescription: z.string().trim().min(1).max(300),
  fullDescription: z.string().trim().min(1).max(4000),
  category: z.enum(['code', 'combat']),
  durationMinutes: z.number().int().min(15).max(480),
  bufferMinutes: z.number().int().min(0).max(120).default(15),
  priceCents: z.number().int().min(0).max(999999),
  priceUnit: z.enum(['session', 'person']).default('session'),
  deliveryType: z.enum(['online', 'in-person', 'hybrid']),
  maxParticipants: z.number().int().min(1).max(100).default(1),
  imageUrl: z.string().url().optional().or(z.literal('')),
  preparationInstructions: z.string().trim().max(1000).optional().or(z.literal('')),
  requiresWaiver: z.boolean().default(false),
  active: z.boolean().default(true),
});
export type ServiceFormData = z.infer<typeof serviceSchema>;

// Availability rule validation (admin)
export const availabilityRuleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  category: z.enum(['code', 'combat']).nullable(),
  active: z.boolean().default(true),
});
export type AvailabilityRuleFormData = z.infer<typeof availabilityRuleSchema>;

// Calendar block validation (admin)
export const calendarBlockSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  reason: z.string().trim().max(200).default('Unavailable'),
});
export type CalendarBlockFormData = z.infer<typeof calendarBlockSchema>;

// Profile validation
export const profileSchema = z.object({
  fullName: z.string().trim().max(200).optional().or(z.literal('')),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  timezone: z.string().min(1),
});
export type ProfileFormData = z.infer<typeof profileSchema>;
