import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AppointmentStatus } from '@/types/domain';

export interface AdminAppointmentFilters {
  status?: AppointmentStatus;
  category?: 'code' | 'combat';
  delivery?: 'online' | 'in-person' | 'hybrid';
  from?: string;
  to?: string;
}

export interface AdminAppointmentRow {
  id: string;
  bookingReference: string;
  status: string;
  startTime: string;
  endTime: string;
  deliveryType: string;
  priceCents: number;
  priceUnit: string;
  adminNotes: string | null;
  notes: string | null;
  serviceName: string;
  serviceCategory: 'code' | 'combat';
  primaryClientName: string;
  primaryClientEmail: string;
  participantCount: number;
}

export async function getAdminAppointments(filters: AdminAppointmentFilters): Promise<AdminAppointmentRow[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from('appointments')
    .select(
      'id, booking_reference, status, start_time, end_time, delivery_type, price_cents, price_unit, admin_notes, notes, services(name, category), appointment_participants(client_name, client_email, is_primary_contact)',
    )
    .order('start_time', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.delivery) query = query.eq('delivery_type', filters.delivery);
  if (filters.from) query = query.gte('start_time', filters.from);
  if (filters.to) query = query.lte('start_time', filters.to);

  const { data, error } = await query;
  if (error || !data) return [];

  const rows: AdminAppointmentRow[] = data.map((row) => {
    const service = row.services as unknown as { name: string; category: 'code' | 'combat' } | null;
    const participants = (row.appointment_participants as unknown as { client_name: string; client_email: string; is_primary_contact: boolean }[]) ?? [];
    const primary = participants.find((p) => p.is_primary_contact) ?? participants[0];
    return {
      id: row.id,
      bookingReference: row.booking_reference,
      status: row.status,
      startTime: row.start_time,
      endTime: row.end_time,
      deliveryType: row.delivery_type,
      priceCents: row.price_cents,
      priceUnit: row.price_unit,
      adminNotes: row.admin_notes,
      notes: row.notes,
      serviceName: service?.name ?? 'Session',
      serviceCategory: service?.category ?? 'code',
      primaryClientName: primary?.client_name ?? '—',
      primaryClientEmail: primary?.client_email ?? '—',
      participantCount: participants.length,
    };
  });

  return filters.category ? rows.filter((r) => r.serviceCategory === filters.category) : rows;
}
