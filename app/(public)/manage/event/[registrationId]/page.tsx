import type { Metadata } from 'next';
import { getManageableEventRegistration } from '@/lib/actions/events';
import { ManageRegistrationClient } from '@/components/workshops/manage-registration-client';

export const metadata: Metadata = { title: 'Manage Your Registration — Code & Combat by Abel' };

export default async function ManageRegistrationPage({
  params,
  searchParams,
}: {
  params: Promise<{ registrationId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { registrationId } = await params;
  const { token } = await searchParams;

  const result = await getManageableEventRegistration(registrationId, token ?? '');

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-cb-bone">Manage Your Registration</h1>
      {!result.success || !result.data ? (
        <p role="alert" className="mt-8 rounded border border-cb-crimson bg-cb-crimson/10 p-4 text-cb-bone">
          {result.error ?? 'This link is invalid or has expired.'} If you need help, use the contact page.
        </p>
      ) : (
        <ManageRegistrationClient registration={result.data} token={token ?? ''} />
      )}
    </div>
  );
}
