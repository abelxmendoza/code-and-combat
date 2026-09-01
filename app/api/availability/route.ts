import { NextRequest, NextResponse } from 'next/server';
import { getBookingRepository } from '@/lib/repository';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const serviceId = searchParams.get('serviceId');
  const rangeStartParam = searchParams.get('rangeStart');
  const rangeEndParam = searchParams.get('rangeEnd');

  if (!serviceId || !rangeStartParam || !rangeEndParam) {
    return NextResponse.json({ error: 'serviceId, rangeStart, and rangeEnd are required.' }, { status: 400 });
  }

  const rangeStart = new Date(rangeStartParam);
  const rangeEnd = new Date(rangeEndParam);
  if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
    return NextResponse.json({ error: 'Invalid date range.' }, { status: 400 });
  }

  const repo = getBookingRepository();
  const services = await repo.listActiveServices();
  const matchedService = services.find((s) => s.id === serviceId);
  if (!matchedService) {
    return NextResponse.json({ error: 'Service not found.' }, { status: 404 });
  }

  const [slots, settings] = await Promise.all([
    repo.getAvailableSlots({ serviceId, rangeStart, rangeEnd }),
    repo.getBookingSettings(),
  ]);

  // Deliberately flat and UTC — grouping by calendar date must happen in
  // the VISITOR's own timezone, not the business timezone, so that's left
  // to the client (see lib/domain/availability.ts groupSlotsByLocalDate,
  // called client-side with the visitor's detected zone).
  return NextResponse.json({ businessTimezone: settings.businessTimezone, slots });
}
