import type { Metadata } from 'next';
import { getActiveServices } from '@/lib/db/services';
import { BookingWizard } from '@/components/booking/booking-wizard';
import type { ServiceCategory } from '@/types/domain';

export const metadata: Metadata = {
  title: 'Book a Session — Code & Combat by Abel',
  description: 'Book coding tutoring, robotics mentoring, or beginner Muay Thai instruction.',
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; service?: string }>;
}) {
  const params = await searchParams;
  const services = await getActiveServices();
  const initialCategory = params.category === 'code' || params.category === 'combat' ? (params.category as ServiceCategory) : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-cb-bone">Book a Session</h1>
      <p className="mb-10 text-cb-gray">A few quick steps — you’ll get a confirmation with a manage link right away.</p>
      <BookingWizard services={services} initialCategory={initialCategory} initialServiceSlug={params.service} />
    </div>
  );
}
