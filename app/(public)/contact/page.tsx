import type { Metadata } from 'next';
import { ContactForm } from '@/components/contact/contact-form';

export const metadata: Metadata = { title: 'Contact — Code & Combat by Abel' };

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ inquiry?: string }>;
}) {
  const params = await searchParams;
  const defaultInquiryType = params.inquiry === 'development' ? 'development' : 'general';

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-cb-bone">Contact</h1>
      <p className="mb-10 text-cb-gray">
        Have a software, app, personal website, or business website project in mind? Share the basics below and
        I&apos;ll follow up to discuss scope, timing, and a tailored quote.
      </p>
      <ContactForm defaultInquiryType={defaultInquiryType} />
    </div>
  );
}
