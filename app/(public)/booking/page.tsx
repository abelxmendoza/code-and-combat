import type { Metadata } from 'next';
import { getBookingRepository } from '@/lib/repository';
import { BookingWizard } from '@/components/booking/booking-wizard';
import type { ServiceCategory } from '@/types/domain';

export const metadata: Metadata = {
  title: 'Book a Session — Code & Combat by Abel',
  description: 'Book coding tutoring or beginner Muay Thai instruction — private sessions, group workshops, or a four-session package.',
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; service?: string }>;
}) {
  const params = await searchParams;
  const repo = getBookingRepository();
  const [services, workshops] = await Promise.all([repo.listActiveServices(), repo.listUpcomingWorkshops()]);
  const initialCategory = params.category === 'code' || params.category === 'combat' ? (params.category as ServiceCategory) : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-cb-bone">Book a Session</h1>
      <p className="mb-10 text-cb-gray">A few quick steps — you’ll get a confirmation right away.</p>
      <BookingWizard services={services} workshops={workshops} initialCategory={initialCategory} initialServiceSlug={params.service} />
    </div>
  );
}
