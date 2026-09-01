import type { BookableService } from '@/types/domain';
import type { AvailabilityRuleInput } from '@/lib/domain/availability';

/**
 * Single source of truth for the four primary customer-facing offers.
 * supabase/seed.sql mirrors these values for the Postgres-backed
 * deployment; this module backs the in-memory local dev/test adapter
 * (lib/repository/local-repository.ts) so the full booking experience
 * works even with no Supabase project configured. Keep the two in sync
 * by hand if you change a price or duration here.
 */

export const CODING_TUTORING_ID = '00000000-0000-4000-8000-000000000001';
export const STRIKING_TRAINING_ID = '00000000-0000-4000-8000-000000000002';

export const LOCAL_OFFERS: BookableService[] = [
  {
    id: CODING_TUTORING_ID,
    slug: 'coding-tutoring',
    name: 'Coding & Tech Tutoring',
    shortDescription: 'Programming fundamentals, debugging, Git/GitHub, AI coding tools, robotics, and ROS.',
    fullDescription:
      "A one-on-one session built around whatever you're working on: programming fundamentals, debugging, Git/GitHub workflows, AI-assisted coding tools, robotics, ROS, or a project you want a second set of eyes on. Tell us briefly what you want help with when you book. Available online or in person.",
    category: 'code',
    durationMinutes: 60,
    priceCents: 5000,
    priceUnit: 'session',
    deliveryType: 'hybrid',
    maxParticipants: 1,
    imageUrl: null,
    preparationInstructions:
      'Have your laptop, a working dev environment, and (if applicable) the repository or assignment you want to work on ready to share your screen.',
    requiresWaiver: false,
  },
  {
    id: STRIKING_TRAINING_ID,
    slug: 'private-striking-training',
    name: 'Private Striking Training',
    shortDescription: 'Beginner Muay Thai fundamentals: footwork, defense, combinations, pad work, and conditioning.',
    fullDescription:
      "A private, beginner-focused lesson: stance, guard, footwork, defensive movement, striking combinations, pad work, and conditioning, taught at your pace. No experience required, and no pressure to spar — this is fundamentals instruction, not medical advice.",
    category: 'combat',
    durationMinutes: 60,
    priceCents: 5000,
    priceUnit: 'session',
    deliveryType: 'in-person',
    maxParticipants: 1,
    imageUrl: null,
    preparationInstructions: 'Wear athletic clothing and bring water. Hand wraps and gloves can be provided if you don’t have your own.',
    requiresWaiver: true,
  },
];

export const LOCAL_OFFER_LOCATIONS: Record<string, { online?: string; 'in-person'?: string }> = {
  [CODING_TUTORING_ID]: {
    online: 'A video call link is emailed after booking is confirmed.',
    'in-person': 'Exact address or meeting point is shared after booking, based on your general location.',
  },
  [STRIKING_TRAINING_ID]: {
    'in-person': 'Exact address or meeting point is shared after booking, based on your general location.',
  },
};

export interface LocalWorkshop {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: 'code' | 'combat';
  startTime: string; // ISO
  durationMinutes: number;
  capacity: number;
  priceCents: number;
  priceUnit: 'person' | 'session';
  deliveryType: 'online' | 'in-person' | 'hybrid';
  location: string | null;
  status: 'scheduled' | 'cancelled' | 'completed';
}

export const LOCAL_WORKSHOPS: LocalWorkshop[] = [
  {
    id: '00000000-0000-4000-8000-000000000101',
    slug: 'ai-pair-programming-bootcamp',
    title: 'Modern Developer Toolkit: AI Pair-Programming Bootcamp',
    description:
      'A live, small-group walkthrough of building a real feature end-to-end with AI-assisted tools — from prompt to reviewed, working code.',
    category: 'code',
    startTime: nextWeekday(5, 18).toISOString(),
    durationMinutes: 90,
    capacity: 12,
    priceCents: 2500,
    priceUnit: 'person',
    deliveryType: 'online',
    location: null,
    status: 'scheduled',
  },
  {
    id: '00000000-0000-4000-8000-000000000102',
    slug: 'beginner-striking-group-class',
    title: 'Beginner Striking Fundamentals — Group Class',
    description:
      'A group class covering stance, guard, footwork, and beginner combinations. Beginner-focused; no experience or contact sparring involved.',
    category: 'combat',
    startTime: nextWeekday(6, 9).toISOString(),
    durationMinutes: 90,
    capacity: 8,
    priceCents: 2500,
    priceUnit: 'person',
    deliveryType: 'in-person',
    location: 'Orange County (exact location shared after registration)',
    status: 'scheduled',
  },
];

export const LOCAL_AVAILABILITY_RULES: AvailabilityRuleInput[] = [
  { dayOfWeek: 1, startTime: '17:00', endTime: '21:00', category: 'code', active: true },
  { dayOfWeek: 2, startTime: '17:00', endTime: '21:00', category: 'code', active: true },
  { dayOfWeek: 3, startTime: '17:00', endTime: '21:00', category: 'code', active: true },
  { dayOfWeek: 4, startTime: '17:00', endTime: '21:00', category: 'code', active: true },
  { dayOfWeek: 2, startTime: '18:00', endTime: '20:00', category: 'combat', active: true },
  { dayOfWeek: 4, startTime: '18:00', endTime: '20:00', category: 'combat', active: true },
  { dayOfWeek: 6, startTime: '08:00', endTime: '13:00', category: 'combat', active: true },
  { dayOfWeek: 0, startTime: '09:00', endTime: '12:00', category: 'combat', active: true },
];

export const LOCAL_BOOKING_SETTINGS = {
  businessTimezone: 'America/Los_Angeles',
  minNoticeHours: 12,
  bookingWindowDays: 45,
  cancellationNoticeHours: 24,
  rescheduleNoticeHours: 24,
};

export const PACKAGE_TOTAL_SESSIONS = 4;
export const PACKAGE_PRICE_CENTS = 18000; // $180 for 4 sessions

/** Next occurrence of a given weekday (0=Sun..6=Sat) at the given local
 * hour, used only to keep local-dev workshop dates perpetually "upcoming"
 * without hardcoding a date that goes stale. */
function nextWeekday(dayOfWeek: number, hour: number): Date {
  const now = new Date();
  const result = new Date(now);
  const daysUntil = (dayOfWeek - now.getUTCDay() + 7) % 7 || 7;
  result.setUTCDate(now.getUTCDate() + daysUntil);
  result.setUTCHours(hour, 0, 0, 0);
  return result;
}
