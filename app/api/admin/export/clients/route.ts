import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/authorization';
import { getAdminClients } from '@/lib/db/admin-clients';
import { toCsv } from '@/lib/domain/csv';

export async function GET() {
  const session = await getSessionUser();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const clients = await getAdminClients();
  const csv = toCsv(
    clients.map((c) => ({
      name: c.name,
      email: c.email,
      phone: c.phone,
      booking_count: c.bookingCount,
      last_booking_at: c.lastBookingAt,
    })),
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="clients-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
