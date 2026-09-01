'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInWithPassword } from '@/lib/actions/auth';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});
type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/portal';
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setError(null);
    const result = await signInWithPassword(values);
    if (!result.success) {
      setError(result.error ?? 'Something went wrong.');
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
        {errors.email && <p className="mt-1 text-sm text-cb-danger">{errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
        {errors.password && <p className="mt-1 text-sm text-cb-danger">{errors.password.message}</p>}
      </div>
      {error && (
        <p role="alert" className="rounded border border-cb-danger bg-cb-danger/10 p-3 text-sm text-cb-bone">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
      <p className="text-center text-sm text-cb-gray">
        No account?{' '}
        <Link href="/signup" className="text-cb-bone underline hover:text-cb-electric">
          Sign up
        </Link>
      </p>
    </form>
  );
}
