import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

/**
 * Refreshes the Supabase auth session cookie on every request. Required by
 * @supabase/ssr so a session doesn't silently expire mid-visit — called
 * from the root middleware.ts.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Touches the session so @supabase/ssr can refresh an expiring token.
  // This runs on nearly every request (see the matcher in middleware.ts),
  // so a Supabase outage or misconfiguration must never take the whole
  // site down with it — fail open and let the page itself decide what to
  // do with an absent session (redirect to /login, etc).
  try {
    await supabase.auth.getUser();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[middleware] Supabase auth check failed, continuing unauthenticated:', err);
  }

  return response;
}
