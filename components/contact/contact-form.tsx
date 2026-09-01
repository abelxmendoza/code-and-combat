'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { submitContactMessage } from '@/lib/actions/contact';

const formSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(100),
  email: z.string().trim().email('Enter a valid email address.'),
  inquiryType: z.enum(['code', 'combat', 'development', 'general']),
  preferredContactMethod: z.enum(['email', 'phone']),
  message: z.string().trim().min(10, 'Say a bit more — at least 10 characters.').max(2000),
  // Deliberately unrestricted — see lib/validation.ts's contactSchema for why
  // this shouldn't reject a filled honeypot at the form-validation level.
  companyWebsite: z.string().max(200).optional().or(z.literal('')),
});
type FormValues = z.infer<typeof formSchema>;

export function ContactForm({ defaultInquiryType = 'general' }: { defaultInquiryType?: FormValues['inquiryType'] }) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const renderedAt = useRef(Date.now());

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { inquiryType: defaultInquiryType, preferredContactMethod: 'email' },
  });

  async function onSubmit(values: FormValues) {
    setStatus('idle');
    setErrorMessage(null);
    const result = await submitContactMessage({ ...values, formRenderedAt: renderedAt.current });
    if (!result.success) {
      setStatus('error');
      setErrorMessage(result.error ?? 'Something went wrong. Please try again.');
      return;
    }
    setStatus('success');
    reset();
  }

  if (status === 'success') {
    return (
      <div role="status" className="card border-cb-electric/40">
        <h2 className="mb-2 text-cb-bone">Message sent</h2>
        <p className="text-cb-gray">Thanks for reaching out — you’ll hear back soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* Honeypot — hidden from real visitors via CSS, not `type="hidden"`, so
          basic bots that autofill visible-looking fields still trip it. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="companyWebsite">Company website</label>
        <input id="companyWebsite" tabIndex={-1} autoComplete="off" {...register('companyWebsite')} />
      </div>

      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" autoComplete="name" {...register('name')} aria-invalid={!!errors.name} />
        {errors.name && <p className="mt-1 text-sm text-cb-danger">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register('email')} aria-invalid={!!errors.email} />
        {errors.email && <p className="mt-1 text-sm text-cb-danger">{errors.email.message}</p>}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="inquiryType">Inquiry type</Label>
          <select id="inquiryType" className="input-field w-full" {...register('inquiryType')}>
            <option value="general">General</option>
            <option value="development">Website / App Development</option>
            <option value="code">Code &amp; College Mentorship</option>
            <option value="combat">Combat</option>
          </select>
        </div>
        <div>
          <Label htmlFor="preferredContactMethod">Preferred contact method</Label>
          <select id="preferredContactMethod" className="input-field w-full" {...register('preferredContactMethod')}>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" {...register('message')} aria-invalid={!!errors.message} />
        {errors.message && <p className="mt-1 text-sm text-cb-danger">{errors.message.message}</p>}
      </div>

      {status === 'error' && (
        <p role="alert" className="rounded border border-cb-danger bg-cb-danger/10 p-3 text-sm text-cb-bone">
          {errorMessage}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  );
}
