import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AdminMetrics } from '@/types/domain';

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  const [{ count: upcomingSessions }, { count: completedSessions }, { count: cancelledSessions }, { count: noShowSessions }, { data: revenueRows }] =
    await Promise.all([
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'confirmed'])
        .gte('start_time', now),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .in('status', ['cancelled_by_client', 'cancelled_by_admin']),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'no_show'),
      supabase
        .from('appointments')
        .select('price_cents, price_unit, appointment_participants(count)')
        .in('status', ['confirmed', 'completed']),
    ]);

  let estimatedRevenueCents = 0;
  let bookingCount = 0;
  for (const row of revenueRows ?? []) {
    const participantCount = (row.appointment_participants as unknown as { count: number }[])?.[0]?.count ?? 1;
    estimatedRevenueCents += row.price_unit === 'person' ? row.price_cents * participantCount : row.price_cents;
    bookingCount += 1;
  }

  return {
    upcomingSessions: upcomingSessions ?? 0,
    completedSessions: completedSessions ?? 0,
    cancelledSessions: cancelledSessions ?? 0,
    noShowSessions: noShowSessions ?? 0,
    estimatedRevenueCents,
    averageBookingValueCents: bookingCount > 0 ? Math.round(estimatedRevenueCents / bookingCount) : 0,
  };
}
