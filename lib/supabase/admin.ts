import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Service-role client. Bypasses Row Level Security entirely — use only for
 * trusted server-side work that legitimately needs to see across every
 * tenant (e.g. CSV export of all clients). Almost everything else should
 * use createServerSupabaseClient() so RLS still applies.
 *
 * The `server-only` import makes bundling this into a Client Component a
 * build-time error, and SUPABASE_SERVICE_ROLE_KEY is never prefixed with
 * NEXT_PUBLIC_, so it's never sent to the browser.
 */
export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
