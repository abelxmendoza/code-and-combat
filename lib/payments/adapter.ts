import 'server-only';

/**
 * Stripe deposits abstraction. Not implemented in the MVP — every service
 * is currently pay-in-person / pay-later, so book_appointment() never
 * requires a payment step. Wire up a real adapter by implementing
 * PaymentAdapter and returning it from getPaymentAdapter() once
 * STRIPE_SECRET_KEY is set (see .env.example); the booking Server Action in
 * lib/actions/booking.ts would then create a PaymentIntent for the
 * service's deposit amount before calling the book_appointment() RPC.
 */

export interface DepositChargeRequest {
  amountCents: number;
  currency: 'usd';
  appointmentId: string;
  clientEmail: string;
}

export interface DepositChargeResult {
  charged: boolean;
  providerPaymentId?: string;
}

export interface PaymentAdapter {
  chargeDeposit(request: DepositChargeRequest): Promise<DepositChargeResult>;
}

class NoopPaymentAdapter implements PaymentAdapter {
  async chargeDeposit(): Promise<DepositChargeResult> {
    return { charged: false };
  }
}

export function getPaymentAdapter(): PaymentAdapter {
  if (process.env.STRIPE_SECRET_KEY) {
    // Future: return new StripePaymentAdapter(process.env.STRIPE_SECRET_KEY);
  }
  return new NoopPaymentAdapter();
}
