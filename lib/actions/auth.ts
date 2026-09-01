'use server';

import { redirect } from 'next/navigation';
import { isAuthRetryableFetchError, isAuthWeakPasswordError, type AuthError } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { ActionResult } from './booking';

const UNREACHABLE_MESSAGE = 'Can’t reach the server right now. Check your connection and try again in a moment.';

/** Never leak a raw driver error (e.g. Node's "fetch failed") to the UI —
 * classify it into something a visitor can actually act on. */
function friendlyAuthError(error: AuthError, fallback: string): string {
  if (isAuthRetryableFetchError(error)) return UNREACHABLE_MESSAGE;
  if (isAuthWeakPasswordError(error)) return 'Choose a stronger password.';
  if (error.status === 422 || error.code === 'user_already_exists') {
    return 'An account with that email already exists — try signing in instead.';
  }
  return fallback;
}

export async function signInWithPassword(input: {
  email: string;
  password: string;
}): Promise<ActionResult<{ signedIn: boolean }>> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email: input.email, password: input.password });
  if (error) {
    return { success: false, error: friendlyAuthError(error, 'Invalid email or password.') };
  }
  return { success: true, data: { signedIn: true } };
}

export async function signUpWithPassword(input: {
  email: string;
  password: string;
  fullName: string;
}): Promise<ActionResult<{ needsEmailConfirmation: boolean }>> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { full_name: input.fullName } },
  });
  if (error) {
    return { success: false, error: friendlyAuthError(error, 'Could not create your account. Please try again.') };
  }
  return { success: true, data: { needsEmailConfirmation: !data.session } };
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut().catch(() => {
    // Best-effort: even if the sign-out request can't reach Supabase, still
    // clear the client and send them home rather than getting stuck.
  });
  redirect('/');
}
