import { createServerSupabaseClient } from '@/lib/supabase/server';
import { toBookableService } from '@/lib/domain/service-mapper';
import type { BookableService } from '@/types/domain';
import type { Service, ServiceLocation } from '@/types/domain';

export async function getActiveServices(): Promise<BookableService[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (error || !data) return [];
  return (data as Service[]).map(toBookableService);
}

export async function getServiceBySlug(slug: string): Promise<BookableService | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) return null;
  return toBookableService(data as Service);
}

export async function getServiceLocations(serviceId: string): Promise<ServiceLocation[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from('service_locations').select('*').eq('service_id', serviceId);
  return data ?? [];
}
