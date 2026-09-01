'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUpWithPassword } from '@/lib/actions/auth';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(100),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});
type FormValues = z.infer<typeof schema>;

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setError(null);
    const result = await signUpWithPassword(values);
    if (!result.success) {
      setError(result.error ?? 'Something went wrong.');
      return;
    }
    setNeedsConfirmation(result.data?.needsEmailConfirmation ?? true);
  }

  if (needsConfirmation) {
    return (
      <p role="status" className="rounded border border-cb-electric/40 bg-cb-dark p-4 text-cb-bone">
        Check your email to confirm your account, then sign in.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div>
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" autoComplete="name" {...register('fullName')} />
        {errors.fullName && <p className="mt-1 text-sm text-cb-crimson">{errors.fullName.message}</p>}
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
        {errors.email && <p className="mt-1 text-sm text-cb-crimson">{errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
        {errors.password && <p className="mt-1 text-sm text-cb-crimson">{errors.password.message}</p>}
      </div>
      {error && (
        <p role="alert" className="rounded border border-cb-crimson bg-cb-crimson/10 p-3 text-sm text-cb-bone">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>
      <p className="text-center text-sm text-cb-gray">
        Already have an account?{' '}
        <Link href="/login" className="text-cb-bone underline hover:text-cb-crimson">
          Sign in
        </Link>
      </p>
    </form>
  );
}
