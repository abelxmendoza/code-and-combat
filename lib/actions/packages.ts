'use server';

import { revalidatePath } from 'next/cache';
import { getBookingRepository } from '@/lib/repository';
import { packagePurchaseSchema } from '@/lib/validation';
import type { ActionResult } from './booking';

export type { PackagePurchaseConfirmationDto as PackagePurchaseConfirmation } from '@/lib/repository';

const PACKAGE_ERROR_MESSAGES: Record<string, string> = {
  INVALID_CLIENT_NAME: 'Enter your full name.',
  INVALID_CLIENT_EMAIL: 'Enter a valid email address.',
};

export async function purchasePackage(
  input: unknown,
): Promise<ActionResult<import('@/lib/repository').PackagePurchaseConfirmationDto>> {
  const parsed = packagePurchaseSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Check the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const repo = getBookingRepository();
  const result = await repo.createPackagePurchase({
    packageType: data.packageType,
    clientName: data.clientName,
    clientEmail: data.clientEmail,
    clientPhone: data.clientPhone,
    notes: data.notes,
  });

  if (!result.success) {
    return { success: false, error: PACKAGE_ERROR_MESSAGES[result.errorCode] ?? 'Unable to start your package purchase. Please try again.' };
  }

  revalidatePath('/booking');

  return { success: true, data: result.data };
}
