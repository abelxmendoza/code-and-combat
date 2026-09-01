import 'server-only';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

export interface SessionUser {
  user: User;
  isAdmin: boolean;
}

/**
 * Returns the current session user (if any) without redirecting. Treats
 * any unexpected failure (Supabase unreachable/misconfigured) as "signed
 * out" rather than throwing — this runs at the top of every admin/portal
 * layout, so a crash here would take the whole page down with it. Failing
 * to "not authenticated" (rather than, say, "is admin") is also the safe
 * direction to fail in.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: isAdmin } = await supabase.rpc('is_admin');

    return { user, isAdmin: Boolean(isAdmin) };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[auth] session check failed, treating as signed out:', err);
    return null;
  }
}

/** Use in a client-portal layout/page: redirects to /login if signed out. */
export async function requireUser(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) redirect('/login?redirectTo=/portal');
  return session;
}

/** Use in an admin layout/page: redirects unless the session is an admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) redirect('/login?redirectTo=/admin');
  if (!session.isAdmin) redirect('/portal?error=not_authorized');
  return session;
}
