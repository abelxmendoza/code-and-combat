'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { contactSchema } from '@/lib/validation';
import type { ActionResult } from './booking';

/**
 * Anti-spam is a lightweight, dependency-free abstraction rather than a
 * third-party CAPTCHA (nothing to configure to get the MVP working):
 *  - a honeypot field (`companyWebsite`) real visitors never see or fill in
 *  - a minimum time-on-form check, since bots typically submit instantly
 * Swap in a real provider (hCaptcha, Turnstile, etc.) later by adding a
 * token field to contactSchema and verifying it here before the insert.
 */
const MIN_FORM_FILL_SECONDS = 3;

export async function submitContactMessage(input: unknown): Promise<ActionResult<{ submitted: boolean }>> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Check the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  if (data.companyWebsite) {
    // Honeypot tripped — silently report success so the bot doesn't retry.
    return { success: true, data: { submitted: true } };
  }
  if (Date.now() - data.formRenderedAt < MIN_FORM_FILL_SECONDS * 1000) {
    return { success: false, error: 'Please try submitting again.' };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('contact_messages').insert({
    name: data.name,
    email: data.email,
    inquiry_type: data.inquiryType,
    preferred_contact_method: data.preferredContactMethod,
    message: data.message,
  });

  if (error) {
    return { success: false, error: 'Something went wrong sending your message. Please try again.' };
  }

  return { success: true, data: { submitted: true } };
}
