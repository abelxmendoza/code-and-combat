import { addMinutes } from 'date-fns';
import { generateAvailableSlots, isWithinRecurringAvailability } from '@/lib/domain/availability';
import {
  LOCAL_OFFERS,
  LOCAL_OFFER_LOCATIONS,
  LOCAL_WORKSHOPS,
  LOCAL_AVAILABILITY_RULES,
  LOCAL_BOOKING_SETTINGS,
  PACKAGE_TOTAL_SESSIONS,
  PACKAGE_PRICE_CENTS,
} from '@/lib/data/offers';
import type { BookableService, AvailableSlotDto } from '@/types/domain';
import type {
  BookingRepository,
  BookingConfirmationDto,
  BookingSettingsDto,
  CreateBookingInput,
  CreatePackagePurchaseInput,
  CreateWorkshopRegistrationInput,
  EventRegistrationConfirmationDto,
  PackagePurchaseConfirmationDto,
  RepoResult,
  WorkshopDto,
} from './types';

/**
 * In-memory adapter used automatically when Supabase isn't configured (see
 * index.ts). Mirrors the same rules the Postgres implementation enforces —
 * server-computed price/duration, real overlap/buffer conflict checking,
 * notice windows, waiver requirement, group capacity — using the exact same
 * lib/domain/availability.ts engine the real deployment uses, just backed
 * by module-level arrays instead of tables. State resets on server
 * restart; that's expected for a local dev/test double, not a production
 * store.
 */

interface StoredAppointment {
  id: string;
  bookingReference: string;
  serviceId: string;
  status: 'confirmed';
  startTime: Date;
  endTime: Date;
  bufferMinutes: number;
  priceCents: number;
  priceUnit: string;
  capacity: number;
  deliveryType: string;
  location: string | null;
  managementToken: string;
  participants: { clientName: string; clientEmail: string }[];
}

interface StoredRegistration {
  id: string;
  eventId: string;
  clientEmail: string;
  status: 'confirmed' | 'waitlisted' | 'cancelled';
  managementToken: string;
}

interface StoredPackage {
  id: string;
  packageReference: string;
  packageType: string;
  clientEmail: string;
  totalSessions: number;
  priceCents: number;
  status: string;
  managementToken: string;
}

/**
 * Next.js dev compiles Server Actions and RSC page renders into separate
 * module graphs, so a plain module-level `let`/`const` array here ends up
 * as a distinct copy per graph rather than a true singleton — writes from
 * a server action (e.g. createBooking) would silently be invisible to a
 * page render's read (e.g. listUpcomingWorkshops). Anchoring on
 * `globalThis` sidesteps that: it's one Node process-wide object no
 * matter how many times this module gets re-evaluated by the bundler.
 */
const globalStore = globalThis as unknown as {
  __cbLocalRepoState?: {
    appointments: StoredAppointment[];
    registrations: StoredRegistration[];
    packages: StoredPackage[];
    referenceCounter: number;
  };
};
const state = (globalStore.__cbLocalRepoState ??= {
  appointments: [],
  registrations: [],
  packages: [],
  referenceCounter: 0,
});
const appointments = state.appointments;
const registrations = state.registrations;
const packages = state.packages;

function generateReference(prefix: string): string {
  state.referenceCounter += 1;
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `${prefix}-${stamp}-LOCAL${String(state.referenceCounter).padStart(3, '0')}`;
}

function generateToken(): string {
  // Same shape as the Postgres-issued tokens (64 hex chars) so downstream
  // code (length checks, URL building) behaves identically either way.
  let token = '';
  for (let i = 0; i < 64; i++) token += Math.floor(Math.random() * 16).toString(16);
  return token;
}

function hasConflict(candidateStart: Date, candidateEnd: Date, bufferMinutes: number, excludeAppointmentId?: string): boolean {
  const blockedEnd = addMinutes(candidateEnd, bufferMinutes);
  return appointments.some((a) => {
    if (a.id === excludeAppointmentId) return false;
    const aBlockedEnd = addMinutes(a.endTime, a.bufferMinutes);
    return candidateStart < aBlockedEnd && blockedEnd > a.startTime;
  });
}

export class LocalBookingRepository implements BookingRepository {
  async listActiveServices(): Promise<BookableService[]> {
    return LOCAL_OFFERS;
  }

  async getServiceBySlug(slug: string): Promise<BookableService | null> {
    return LOCAL_OFFERS.find((o) => o.slug === slug) ?? null;
  }

  async listUpcomingWorkshops(): Promise<WorkshopDto[]> {
    const now = new Date();
    return LOCAL_WORKSHOPS.filter((w) => w.status === 'scheduled' && new Date(w.startTime) >= now).map((w) => ({
      ...w,
      confirmedCount: registrations.filter((r) => r.eventId === w.id && r.status === 'confirmed').length,
    }));
  }

  async getBookingSettings(): Promise<BookingSettingsDto> {
    return LOCAL_BOOKING_SETTINGS;
  }

  async getAvailableSlots({
    serviceId,
    rangeStart,
    rangeEnd,
  }: {
    serviceId: string;
    rangeStart: Date;
    rangeEnd: Date;
  }): Promise<AvailableSlotDto[]> {
    const service = LOCAL_OFFERS.find((o) => o.id === serviceId);
    if (!service) return [];

    const activeAppointments = appointments.map((a) => ({
      serviceId: a.serviceId,
      startTime: a.startTime,
      endTime: a.endTime,
      bufferMinutes: a.bufferMinutes,
      capacity: a.capacity,
      participantCount: a.participants.length,
    }));

    const slots = generateAvailableSlots({
      serviceId,
      category: service.category,
      durationMinutes: service.durationMinutes,
      maxParticipants: service.maxParticipants,
      businessTimezone: LOCAL_BOOKING_SETTINGS.businessTimezone,
      minNoticeHours: LOCAL_BOOKING_SETTINGS.minNoticeHours,
      bookingWindowDays: LOCAL_BOOKING_SETTINGS.bookingWindowDays,
      rangeStart,
      rangeEnd,
      rules: LOCAL_AVAILABILITY_RULES,
      overrides: [],
      blocks: [],
      existingAppointments: activeAppointments,
    });

    return slots.map((s) => ({
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      capacity: s.capacity,
      remainingCapacity: s.remainingCapacity,
      isGroupSlot: s.isGroupSlot,
    }));
  }

  async createBooking(input: CreateBookingInput): Promise<RepoResult<BookingConfirmationDto>> {
    const service = LOCAL_OFFERS.find((o) => o.id === input.serviceId);
    if (!service) return { success: false, errorCode: 'SERVICE_NOT_FOUND' };

    if (!input.clientName || input.clientName.trim().length < 2) {
      return { success: false, errorCode: 'INVALID_CLIENT_NAME' };
    }
    if (!input.clientEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.clientEmail)) {
      return { success: false, errorCode: 'INVALID_CLIENT_EMAIL' };
    }
    if (service.deliveryType !== 'hybrid' && input.deliveryType !== service.deliveryType) {
      return { success: false, errorCode: 'INVALID_DELIVERY_TYPE' };
    }
    if (service.requiresWaiver && !input.waiverAccepted) {
      return { success: false, errorCode: 'WAIVER_REQUIRED' };
    }

    const startTime = new Date(input.startTimeIso);
    const endTime = addMinutes(startTime, service.durationMinutes);
    const now = new Date();

    if (startTime < addMinutes(now, LOCAL_BOOKING_SETTINGS.minNoticeHours * 60)) {
      return { success: false, errorCode: 'OUTSIDE_NOTICE_WINDOW' };
    }
    if (startTime > addMinutes(now, LOCAL_BOOKING_SETTINGS.bookingWindowDays * 24 * 60)) {
      return { success: false, errorCode: 'OUTSIDE_BOOKING_WINDOW' };
    }
    if (!isWithinRecurringAvailability(startTime, endTime, service.category, LOCAL_BOOKING_SETTINGS.businessTimezone, LOCAL_AVAILABILITY_RULES, [])) {
      return { success: false, errorCode: 'SLOT_NOT_AVAILABLE' };
    }

    const bufferMinutes = 15;

    // Group services join an existing slot instead of creating a new one —
    // same behavior as book_appointment()'s SQL.
    if (service.maxParticipants > 1) {
      const existing = appointments.find(
        (a) => a.serviceId === service.id && a.startTime.getTime() === startTime.getTime(),
      );
      if (existing) {
        if (existing.participants.length >= existing.capacity) {
          return { success: false, errorCode: 'SESSION_FULL' };
        }
        if (existing.participants.some((p) => p.clientEmail === input.clientEmail.toLowerCase())) {
          return { success: false, errorCode: 'ALREADY_BOOKED' };
        }
        existing.participants.push({ clientName: input.clientName, clientEmail: input.clientEmail.toLowerCase() });
        return {
          success: true,
          data: {
            appointmentId: existing.id,
            bookingReference: existing.bookingReference,
            managementToken: generateToken(),
            startTime: existing.startTime.toISOString(),
            endTime: existing.endTime.toISOString(),
            priceCents: existing.priceCents,
            priceUnit: existing.priceUnit,
            location: existing.location,
          },
        };
      }
    }

    if (hasConflict(startTime, endTime, bufferMinutes)) {
      return { success: false, errorCode: 'SLOT_NOT_AVAILABLE' };
    }

    const location = LOCAL_OFFER_LOCATIONS[service.id]?.[input.deliveryType as 'online' | 'in-person'] ?? null;
    const appointment: StoredAppointment = {
      id: crypto.randomUUID(),
      bookingReference: generateReference('CC'),
      serviceId: service.id,
      status: 'confirmed',
      startTime,
      endTime,
      bufferMinutes,
      priceCents: service.priceCents,
      priceUnit: service.priceUnit,
      capacity: service.maxParticipants,
      deliveryType: input.deliveryType,
      location,
      managementToken: generateToken(),
      participants: [{ clientName: input.clientName, clientEmail: input.clientEmail.toLowerCase() }],
    };
    appointments.push(appointment);

    return {
      success: true,
      data: {
        appointmentId: appointment.id,
        bookingReference: appointment.bookingReference,
        managementToken: appointment.managementToken,
        startTime: appointment.startTime.toISOString(),
        endTime: appointment.endTime.toISOString(),
        priceCents: appointment.priceCents,
        priceUnit: appointment.priceUnit,
        location: appointment.location,
      },
    };
  }

  async createWorkshopRegistration(
    input: CreateWorkshopRegistrationInput,
  ): Promise<RepoResult<EventRegistrationConfirmationDto>> {
    const workshop = LOCAL_WORKSHOPS.find((w) => w.id === input.eventId && w.status === 'scheduled');
    if (!workshop) return { success: false, errorCode: 'EVENT_NOT_FOUND' };
    if (new Date(workshop.startTime) < new Date()) return { success: false, errorCode: 'EVENT_ALREADY_STARTED' };

    const email = input.clientEmail.toLowerCase();
    if (registrations.some((r) => r.eventId === workshop.id && r.clientEmail === email && r.status !== 'cancelled')) {
      return { success: false, errorCode: 'ALREADY_REGISTERED' };
    }

    const confirmedCount = registrations.filter((r) => r.eventId === workshop.id && r.status === 'confirmed').length;
    const status = confirmedCount < workshop.capacity ? 'confirmed' : 'waitlisted';

    const registration: StoredRegistration = {
      id: crypto.randomUUID(),
      eventId: workshop.id,
      clientEmail: email,
      status,
      managementToken: generateToken(),
    };
    registrations.push(registration);

    return {
      success: true,
      data: { registrationId: registration.id, status: registration.status as 'confirmed' | 'waitlisted', managementToken: registration.managementToken },
    };
  }

  async createPackagePurchase(input: CreatePackagePurchaseInput): Promise<RepoResult<PackagePurchaseConfirmationDto>> {
    if (!input.clientName || input.clientName.trim().length < 2) {
      return { success: false, errorCode: 'INVALID_CLIENT_NAME' };
    }
    if (!input.clientEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.clientEmail)) {
      return { success: false, errorCode: 'INVALID_CLIENT_EMAIL' };
    }

    const pkg: StoredPackage = {
      id: crypto.randomUUID(),
      packageReference: generateReference('CC-PKG'),
      packageType: input.packageType,
      clientEmail: input.clientEmail.toLowerCase(),
      totalSessions: PACKAGE_TOTAL_SESSIONS,
      priceCents: PACKAGE_PRICE_CENTS,
      status: 'pending_payment',
      managementToken: generateToken(),
    };
    packages.push(pkg);

    return {
      success: true,
      data: {
        packageId: pkg.id,
        packageReference: pkg.packageReference,
        managementToken: pkg.managementToken,
        totalSessions: pkg.totalSessions,
        priceCents: pkg.priceCents,
        status: pkg.status,
      },
    };
  }
}

/** Test-only escape hatch to reset in-memory state between test runs. */
export function __resetLocalRepositoryStateForTests() {
  appointments.length = 0;
  registrations.length = 0;
  packages.length = 0;
}
