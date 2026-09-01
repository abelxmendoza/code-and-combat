import type { Service } from '@/types/domain';
import type { BookableService } from '@/types/domain';

export function toBookableService(row: Service): BookableService {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    fullDescription: row.full_description,
    category: row.category,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
    priceUnit: row.price_unit,
    deliveryType: row.delivery_type,
    maxParticipants: row.max_participants,
    imageUrl: row.image_url,
    preparationInstructions: row.preparation_instructions,
    requiresWaiver: row.requires_waiver,
  };
}
