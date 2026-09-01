import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface ClientBookingRow {
  id: string;
  bookingReference: string;
  status: string;
  startTime: string;
  endTime: string;
  deliveryType: string;
  location: string | null;
  priceCents: number;
  priceUnit: string;
  managementToken: string;
  serviceName: string;
  serviceCategory: string;
}

/**
 * RLS ("Appointments viewable by admin or participant") already scopes
 * this to the signed-in user's own bookings — no explicit filter needed.
 */
export async function getMyBookings(): Promise<{ upcoming: ClientBookingRow[]; past: ClientBookingRow[] }> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('appointments')
    .select('id, booking_reference, status, start_time, end_time, delivery_type, location, price_cents, price_unit, management_token, services(name, category)')
    .order('start_time', { ascending: true });

  if (error || !data) return { upcoming: [], past: [] };

  const now = new Date();
  const rows: ClientBookingRow[] = data.map((row) => {
    const service = row.services as unknown as { name: string; category: string } | null;
    return {
      id: row.id,
      bookingReference: row.booking_reference,
      status: row.status,
      startTime: row.start_time,
      endTime: row.end_time,
      deliveryType: row.delivery_type,
      location: row.location,
      priceCents: row.price_cents,
      priceUnit: row.price_unit,
      managementToken: row.management_token,
      serviceName: service?.name ?? 'Session',
      serviceCategory: service?.category ?? 'code',
    };
  });

  const upcoming = rows.filter((r) => new Date(r.startTime) >= now && (r.status === 'pending' || r.status === 'confirmed'));
  const past = rows
    .filter((r) => !(new Date(r.startTime) >= now && (r.status === 'pending' || r.status === 'confirmed')))
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return { upcoming, past };
}
