import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/authorization';
import { getAdminAppointments } from '@/lib/db/admin-appointments';
import { toCsv } from '@/lib/domain/csv';

export async function GET() {
  const session = await getSessionUser();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const appointments = await getAdminAppointments({});
  const csv = toCsv(
    appointments.map((a) => ({
      booking_reference: a.bookingReference,
      status: a.status,
      start_time: a.startTime,
      end_time: a.endTime,
      service: a.serviceName,
      category: a.serviceCategory,
      delivery_type: a.deliveryType,
      price_cents: a.priceCents,
      price_unit: a.priceUnit,
      client_name: a.primaryClientName,
      client_email: a.primaryClientEmail,
      participant_count: a.participantCount,
    })),
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="appointments-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
