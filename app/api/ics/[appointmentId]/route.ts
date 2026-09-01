import { NextRequest, NextResponse } from 'next/server';
import { getManageableAppointment } from '@/lib/actions/booking';
import { generateIcsEvent } from '@/lib/domain/ics';

export async function GET(request: NextRequest, { params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params;
  const token = request.nextUrl.searchParams.get('token') ?? '';

  const result = await getManageableAppointment(appointmentId, token);
  if (!result.success || !result.data) {
    return NextResponse.json({ error: result.error ?? 'Not found.' }, { status: 404 });
  }

  const appointment = result.data;
  const ics = generateIcsEvent({
    uid: `${appointment.id}@codeandcombat.abel`,
    title: appointment.serviceName,
    description: appointment.notes ?? undefined,
    location: appointment.location ?? undefined,
    startTime: new Date(appointment.startTime),
    endTime: new Date(appointment.endTime),
  });

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${appointment.bookingReference}.ics"`,
    },
  });
}
