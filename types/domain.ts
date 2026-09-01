import type { Database, DeliveryType, ServiceCategory, PriceUnit } from './database';

export type Service = Database['public']['Tables']['services']['Row'];
export type ServiceLocation = Database['public']['Tables']['service_locations']['Row'];
export type Appointment = Database['public']['Tables']['appointments']['Row'];
export type AppointmentParticipant = Database['public']['Tables']['appointment_participants']['Row'];
export type AvailabilityRule = Database['public']['Tables']['availability_rules']['Row'];
export type AvailabilityOverride = Database['public']['Tables']['availability_overrides']['Row'];
export type CalendarBlock = Database['public']['Tables']['calendar_blocks']['Row'];
export type BookingSettings = Database['public']['Tables']['booking_settings']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type GroupEvent = Database['public']['Tables']['group_events']['Row'];
export type EventRegistration = Database['public']['Tables']['event_registrations']['Row'];
export type ClientNote = Database['public']['Tables']['client_notes']['Row'];
export type SessionPackage = Database['public']['Tables']['session_packages']['Row'];

export type { ServiceCategory, DeliveryType, PriceUnit } from './database';
export type { AppointmentStatus } from './database';

/** Lightweight service shape used by the public booking wizard. */
export interface BookableService {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  category: ServiceCategory;
  durationMinutes: number;
  priceCents: number;
  priceUnit: PriceUnit;
  deliveryType: DeliveryType;
  maxParticipants: number;
  imageUrl: string | null;
  preparationInstructions: string | null;
  requiresWaiver: boolean;
}

export interface AvailableSlotDto {
  startTime: string; // ISO UTC
  endTime: string;
  capacity: number;
  remainingCapacity: number;
  isGroupSlot: boolean;
}

export interface AdminMetrics {
  upcomingSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  noShowSessions: number;
  estimatedRevenueCents: number;
  averageBookingValueCents: number;
}
