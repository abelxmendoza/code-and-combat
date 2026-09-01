import type { Metadata } from 'next';
import { getManageableAppointment } from '@/lib/actions/booking';
import { ManageBookingClient } from '@/components/booking/manage-booking-client';

export const metadata: Metadata = { title: 'Manage Your Booking — Code & Combat by Abel' };

export default async function ManageBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ appointmentId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { appointmentId } = await params;
  const { token } = await searchParams;

  const result = await getManageableAppointment(appointmentId, token ?? '');

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-cb-bone">Manage Your Booking</h1>
      {!result.success || !result.data ? (
        <p role="alert" className="mt-8 rounded border border-cb-danger bg-cb-danger/10 p-4 text-cb-bone">
          {result.error ?? 'This link is invalid or has expired.'} If you need help, use the contact page.
        </p>
      ) : (
        <ManageBookingClient appointment={result.data} token={token ?? ''} />
      )}
    </div>
  );
}
