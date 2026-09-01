import { SupabaseBookingRepository } from './supabase-repository';
import { LocalBookingRepository } from './local-repository';
import type { BookingRepository } from './types';

export type { BookingRepository } from './types';
export * from './types';

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;
  // Placeholder values from .env.example — treat as "not configured" so
  // local dev automatically falls back to the in-memory adapter instead of
  // making doomed network calls to a fake project.
  if (url.includes('your-project') || anonKey.includes('your-anon-key')) return false;
  return true;
}

let cachedRepository: BookingRepository | null = null;

/**
 * Returns the Supabase-backed repository when real credentials are
 * configured, otherwise the in-memory local adapter — so the booking
 * experience is fully usable (and testable) either way. See
 * lib/repository/types.ts for the interface both implement.
 */
export function getBookingRepository(): BookingRepository {
  if (cachedRepository) return cachedRepository;
  cachedRepository = isSupabaseConfigured() ? new SupabaseBookingRepository() : new LocalBookingRepository();
  return cachedRepository;
}
