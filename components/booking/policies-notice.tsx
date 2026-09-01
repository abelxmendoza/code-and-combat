/**
 * Booking policies shown during checkout. Deposits aren't actually
 * charged yet — Stripe isn't wired up in this phase (see
 * lib/payments/adapter.ts) — so this is disclosure of the eventual
 * policy, not a live payment step. Never imply a deposit was collected.
 */
export function PoliciesNotice() {
  return (
    <div className="rounded border border-cb-steel bg-cb-dark p-4 text-sm text-cb-gray">
      <p className="mb-2 font-semibold text-cb-bone">Booking policies</p>
      <ul className="list-inside list-disc space-y-1">
        <li>A 25% deposit will eventually be required to reserve a session.</li>
        <li>Free cancellation or rescheduling until 24 hours before the session.</li>
        <li>Late cancellations and no-shows forfeit the deposit.</li>
        <li>Travel outside the normal Orange County service area may require an additional fee.</li>
      </ul>
      <p className="mt-3 text-mono text-cb-amber">Payment integration coming soon — no payment is collected today.</p>
    </div>
  );
}
