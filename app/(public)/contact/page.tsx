import type { Metadata } from 'next';
import { ContactForm } from '@/components/contact/contact-form';

export const metadata: Metadata = { title: 'Contact — Code & Combat by Abel' };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-cb-bone">Contact</h1>
      <p className="mb-10 text-cb-gray">
        Questions before booking, or something that doesn’t fit the booking flow — send a message below.
      </p>
      <ContactForm />
    </div>
  );
}
