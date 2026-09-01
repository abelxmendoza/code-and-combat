import { test, expect, type Page } from '@playwright/test';

/**
 * Critical guest booking flow, end to end:
 *   1. Visitor selects a service
 *   2. Visitor selects an available slot
 *   3. Visitor enters their information
 *   4. Booking is confirmed
 *   5. That slot is no longer offered to a second visitor
 *   6. Admin can see the appointment on the dashboard
 *   7. The client can cancel using their secure manage link
 *
 * Requires a real Supabase project with the migrations + seed applied
 * (`npm run db:seed` against a local `supabase start`, or a hosted
 * project) and the app running against it (`npm run dev`). Admin
 * verification additionally needs a seeded admin account — set
 * E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD for a user promoted to admin via:
 *   insert into public.user_roles (user_id, role)
 *   select id, 'admin' from auth.users where email = '<E2E_ADMIN_EMAIL>';
 *
 * Without those two env vars, steps 1–5 and 7 still run; step 6 is skipped.
 */

const CODING_TUTORING_SLUG = 'coding-tutoring';

async function completeGuestBooking(page: Page, email: string) {
  await page.goto(`/booking?service=${CODING_TUTORING_SLUG}`);

  // Step 2: an available slot is showing and selectable.
  await expect(page.getByRole('heading', { name: /pick a date and time/i })).toBeVisible();
  const firstDateTab = page.getByRole('tab').first();
  await expect(firstDateTab).toBeVisible({ timeout: 15_000 });
  await firstDateTab.click();

  const firstSlotButton = page.getByRole('tabpanel').getByRole('button').first();
  await expect(firstSlotButton).toBeVisible();
  const slotLabel = await firstSlotButton.textContent();
  await firstSlotButton.click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // Step 3: client details.
  await page.getByLabel('Full name').fill('Playwright Test User');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: /continue to review/i }).click();

  // Review + confirm.
  await expect(page.getByRole('heading', { name: /review your booking/i })).toBeVisible();
  await page.getByRole('button', { name: /confirm booking/i }).click();

  // Step 4: confirmation.
  await expect(page.getByRole('heading', { name: /you.re booked/i })).toBeVisible({ timeout: 15_000 });
  const manageLink = await page.getByRole('link', { name: /manage this booking/i }).getAttribute('href');
  expect(manageLink).toBeTruthy();

  return { slotLabel, manageLink: manageLink! };
}

test.describe('guest booking flow', () => {
  test('a visitor can book, and the slot disappears for the next visitor', async ({ page, browser }) => {
    const email = `playwright-${Date.now()}@example.com`;
    const { slotLabel } = await completeGuestBooking(page, email);

    // Step 5: the same 1:1 slot must not be offered to a second visitor.
    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();
    await secondPage.goto(`/booking?service=${CODING_TUTORING_SLUG}`);
    const firstDateTab = secondPage.getByRole('tab').first();
    if (await firstDateTab.isVisible().catch(() => false)) {
      await firstDateTab.click();
      const stillOffered = secondPage.getByRole('tabpanel').getByRole('button', { name: slotLabel ?? '__none__' });
      await expect(stillOffered).toHaveCount(0);
    }
    await secondContext.close();
  });

  test('the client can cancel their booking from the secure manage link', async ({ page }) => {
    const email = `playwright-cancel-${Date.now()}@example.com`;
    const { manageLink } = await completeGuestBooking(page, email);

    await page.goto(manageLink);
    await expect(page.getByRole('heading', { name: /manage your booking/i })).toBeVisible();
    await page.getByRole('button', { name: /cancel booking/i }).click();
    await page.getByRole('button', { name: /yes, cancel it/i }).click();
    await expect(page.getByText(/cancelled/i).first()).toBeVisible();
  });
});

test.describe('admin visibility', () => {
  test.skip(
    !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
    'Set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (a seeded admin account) to run this check.',
  );

  test('a booked appointment appears on the admin appointments list', async ({ page, context }) => {
    const email = `playwright-admin-check-${Date.now()}@example.com`;
    const bookingPage = await context.newPage();
    await completeGuestBooking(bookingPage, email);
    await bookingPage.close();

    await page.goto('/login');
    await page.getByLabel('Email').fill(process.env.E2E_ADMIN_EMAIL!);
    await page.getByLabel('Password').fill(process.env.E2E_ADMIN_PASSWORD!);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.goto('/admin/appointments');
    await expect(page.getByText(email)).toBeVisible({ timeout: 15_000 });
  });
});
