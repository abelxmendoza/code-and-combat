import type { Metadata } from 'next';
import { SignupForm } from '@/components/auth/signup-form';

export const metadata: Metadata = { title: 'Create Account — Code & Combat by Abel' };

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-cb-bone">Create Account</h1>
      <SignupForm />
    </div>
  );
}
