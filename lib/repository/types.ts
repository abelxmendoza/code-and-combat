import type { BookableService, AvailableSlotDto, ServiceCategory, DeliveryType } from '@/types/domain';

/**
 * Typed contract for everything the public booking experience needs. Two
 * implementations exist: SupabaseBookingRepository (production, talks to
 * Postgres) and LocalBookingRepository (in-memory, used automatically
 * whenever Supabase isn't configured — see lib/repository/index.ts). Both
 * enforce the same rules (server-computed price/duration, real conflict
 * checking, capacity limits) so the interface behaves identically either
 * way; only the storage differs.
 */

export type RepoResult<T> = { success: true; data: T } | { success: false; errorCode: string };

export interface WorkshopDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: ServiceCategory;
  startTime: string;
  durationMinutes: number;
  capacity: number;
  priceCents: number;
  priceUnit: 'person' | 'session';
  deliveryType: DeliveryType;
  location: string | null;
  status: 'scheduled' | 'cancelled' | 'completed';
  confirmedCount: number;
}

export interface BookingSettingsDto {
  businessTimezone: string;
  minNoticeHours: number;
  bookingWindowDays: number;
  cancellationNoticeHours: number;
  rescheduleNoticeHours: number;
}

export interface CreateBookingInput {
  serviceId: string;
  startTimeIso: string;
  deliveryType: DeliveryType;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  notes?: string;
  timezone: string;
  waiverAccepted: boolean;
  clientId?: string | null;
}

export interface BookingConfirmationDto {
  appointmentId: string;
  bookingReference: string;
  managementToken: string;
  startTime: string;
  endTime: string;
  priceCents: number;
  priceUnit: string;
  location: string | null;
}

export interface CreateWorkshopRegistrationInput {
  eventId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientId?: string | null;
}

export interface EventRegistrationConfirmationDto {
  registrationId: string;
  status: 'confirmed' | 'waitlisted';
  managementToken: string;
}

export interface CreatePackagePurchaseInput {
  packageType: ServiceCategory;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  notes?: string;
}

export interface PackagePurchaseConfirmationDto {
  packageId: string;
  packageReference: string;
  managementToken: string;
  totalSessions: number;
  priceCents: number;
  status: string;
}

export interface BookingRepository {
  listActiveServices(): Promise<BookableService[]>;
  getServiceBySlug(slug: string): Promise<BookableService | null>;
  listUpcomingWorkshops(): Promise<WorkshopDto[]>;
  getBookingSettings(): Promise<BookingSettingsDto>;
  getAvailableSlots(params: { serviceId: string; rangeStart: Date; rangeEnd: Date }): Promise<AvailableSlotDto[]>;
  createBooking(input: CreateBookingInput): Promise<RepoResult<BookingConfirmationDto>>;
  createWorkshopRegistration(input: CreateWorkshopRegistrationInput): Promise<RepoResult<EventRegistrationConfirmationDto>>;
  createPackagePurchase(input: CreatePackagePurchaseInput): Promise<RepoResult<PackagePurchaseConfirmationDto>>;
}
