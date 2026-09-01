# Code & Combat by Abel

A production-quality appointment-booking website for software tutoring, robotics mentoring, and beginner Muay Thai instruction.

**Positioning**: "Build sharper. Move stronger."

---

## What's implemented

- **Public site**: home, services (real data), workshops, about, contact
- **Multi-step booking wizard**: category → service → date/time (visitor-timezone-aware) → details → review → confirmation, with `.ics` download
- **Guest-friendly booking management**: secure token-based `/manage/[id]` links to cancel or reschedule, no account required
- **Client portal**: upcoming/past bookings, profile, all gated by Supabase Auth
- **Admin dashboard**: metrics, drag-and-drop calendar (month/week/agenda), appointment management, services CRUD, availability rules/blocks, booking policy settings, client search + private notes, workshop management, CSV export
- **Transactional booking engine** enforced entirely in Postgres (see [Booking conflict prevention](#booking-conflict-prevention-the-most-important-part))
- **Row Level Security** on every table; admin-only writes with guest/client mutations routed through `SECURITY DEFINER` functions
- **38 passing unit tests** (Vitest) + a full Playwright critical-path spec
- Adapters for Stripe deposits, Google Calendar sync, and email/SMS notifications — none required for the MVP to work, all documented no-ops until credentials are added

---

## Tech stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript (strict)
- **State**: Redux Toolkit (booking-wizard/admin UI state only — server state is fetched directly in Server Components, not duplicated into Redux)
- **Styling**: Tailwind CSS + a small hand-built shadcn/ui-style component set on top of Radix primitives
- **Forms**: React Hook Form + Zod
- **Database / Auth**: Supabase (Postgres + Supabase Auth), accessed via `@supabase/ssr` and `@supabase/supabase-js`
- **Dates**: date-fns / date-fns-tz
- **Calendar**: react-big-calendar (admin dashboard) with the drag-and-drop addon
- **Testing**: Vitest (unit) + Playwright (e2e)

---

## Getting started

### Prerequisites

- Node.js 18+
- npm
- A Supabase project (free tier is fine), or the Supabase CLI for local dev

### 1. Install

```bash
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from your Supabase project settings. Everything else in `.env.example` is optional — the app runs fully without them (see [Future integrations](#future-integrations-adapters-already-in-place)).

### 3. Database

**Local (recommended for development)**, using the Supabase CLI:

```bash
supabase start        # spins up a local Postgres + Auth stack in Docker
supabase db reset     # applies every migration in supabase/migrations/, then supabase/seed.sql
```

Point `.env.local` at the local stack's URL/keys (printed by `supabase start`).

**Hosted project**: push the migrations, then seed:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
npm run db:seed        # runs supabase/seed.sql against DATABASE_URL
```

### 4. Promote yourself to admin

Sign up once through `/signup`, then run against your database:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'you@example.com'
on conflict do nothing;
```

### 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Admin dashboard is at `/admin` (requires the step above).

---

## Available scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Start the production server |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run type-check` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright e2e (needs a seeded Supabase project + `npm run dev` running — see `tests/e2e/booking-flow.spec.ts`) |
| `npm run db:seed` | Applies `supabase/seed.sql` (via `DATABASE_URL`, or falls back to `supabase db reset` locally) |
| `npm run db:types` | Regenerates `types/database.ts` from a local Supabase instance |

---

## Architecture

```
app/
├── (public)/        # Home, services, workshops, about, contact, booking, manage/*
├── (auth)/           # /login, /signup
├── (client)/portal/  # Client portal — requireUser() gated
├── (admin)/admin/    # Admin dashboard — requireAdmin() gated
└── api/               # Route handlers: availability, .ics download, CSV export, auth callback

components/
├── ui/               # Small shadcn/ui-style primitives (Button, Input, Dialog, Toast, ...)
├── layout/            # Navbar, footer
├── booking/           # The multi-step wizard + manage/cancel/reschedule UI
├── admin/             # Admin dashboard components (calendar, forms, tables)
├── auth/, contact/, workshops/

lib/
├── supabase/          # server.ts (RLS-scoped), browser.ts, admin.ts (service-role, server-only), middleware.ts
├── domain/            # Pure logic: availability.ts, ics.ts, csv.ts, service-mapper.ts
├── db/                # Server-side data-access functions (one file per feature area)
├── actions/           # 'use server' Server Actions — the only write path for the browser
├── auth/              # requireUser() / requireAdmin() route guards
├── notifications/, calendar-sync/, payments/   # Adapter abstractions (see below)
├── validation.ts      # All Zod schemas
└── timezone.ts, tokens.ts, utils.ts

store/                 # Redux: booking wizard draft + step, admin UI filters/calendar view
types/                  # database.ts (hand-maintained Supabase types), domain.ts
supabase/
├── migrations/        # 11 migrations — schema, RLS, and the booking engine
└── seed.sql            # Starter services, availability, and two example workshops

tests/
├── unit/              # Vitest — availability engine, timezone conversion, validation, ics/csv, tokens
└── e2e/                # Playwright — critical guest booking flow
```

### Server Components vs. Server Actions vs. Route Handlers

- **Server Components** (default everywhere) do all read-side data fetching — `lib/db/*.ts` functions are called directly from pages, no client-side fetch/loading state needed for the initial render.
- **Client Components** exist only where interaction requires them: the booking wizard, forms, the admin calendar, toasts.
- **Server Actions** (`lib/actions/*.ts`) are the *only* way the browser can write data. They validate with Zod, then either call a Postgres RPC (bookings, cancellations, reschedules, event registration — see below) or a direct RLS-scoped table write (admin CRUD, where RLS itself is the authorization check).
- **Route Handlers** (`app/api/*`) are used for three things that don't fit the Server Action model: the availability search (`GET`, cacheable, called from client-side `fetch` as the user browses dates), file downloads (`.ics`, CSV export — need real `Content-Disposition` headers), and the Supabase auth callback (needs to run before any React tree exists).

### Booking conflict prevention (the most important part)

Double-booking is prevented **in the database**, not in the UI:

- `appointments.blocked_range` is a `tstzrange` covering `[start_time, end_time + buffer_minutes)`, maintained by a trigger.
- A Postgres **exclusion constraint** (`EXCLUDE USING gist (blocked_range WITH &&)`) makes two overlapping active appointments structurally impossible — this is enforced by Postgres itself, with proper locking, under concurrent load. No advisory locks or client-side "check then insert" race conditions.
- All guest/client writes go through `SECURITY DEFINER` functions (`book_appointment`, `cancel_appointment_by_token`, `reschedule_appointment_by_token`, `register_for_event`, ...) in `supabase/migrations/0008_functions.sql` and `0011_admin_functions.sql`. These functions **recompute price, duration, and buffer from the `services` table** — a client can never supply its own price or duration (see the test in `tests/unit/validation.test.ts` asserting `bookingSchema` doesn't even define those fields).
- Direct table INSERT/UPDATE on `appointments` is admin-only via RLS; the functions bypass that (by design, as `SECURITY DEFINER`) after doing their own validation.
- Group sessions (`max_participants > 1`) work by having every attendee's booking call join the *same* `appointments` row (via `appointment_participants`) instead of creating a new, overlapping one — so the exclusion constraint only ever fires on genuinely conflicting bookings.

This was validated directly against a throwaway local Postgres instance during development (overlap rejection, buffer enforcement, group-capacity joins, waiver requirement, notice/cancellation/reschedule windows all confirmed) before any application code was written against it.

### Timezone handling

All timestamps are stored in UTC. `lib/domain/availability.ts` mirrors the database's `is_within_availability()` logic in TypeScript for fast UI rendering — but the actual booking write always re-validates from scratch via the RPC, so a client can never trust a slot it was shown. Availability is computed relative to a `business_timezone` setting (`booking_settings` table); the wizard displays times in the **visitor's own detected timezone**, converted client-side.

> One real bug caught during development, worth calling out: `date-fns-tz` v2's `utcToZonedTime()` writes its result back through the **host process's local** `Date` setters, so reading it back requires *local* getters, not UTC getters — using UTC getters silently no-ops whenever the host machine's timezone happens to match the target timezone (exactly what happened here, since this dev environment runs in `America/Los_Angeles`). Fixed in `lib/domain/availability.ts` and covered by `tests/unit/timezone.test.ts`, which is run under multiple `TZ` values to guard against regressions.

---

## Security

- **Row Level Security** on every table (`supabase/migrations/0002`–`0010`). Public tables (services, availability, workshops) are readable by anyone; everything else is admin-only or scoped to the authenticated owner.
- **No direct guest/client writes** to `appointments`, `appointment_participants`, `event_registrations`, or `waiver_records` — only through the `SECURITY DEFINER` RPCs, which independently re-validate every business rule server-side.
- **Server-side price/duration validation**: the booking form never sends a price or duration; the database always computes them from the current `services` row.
- **Secure management tokens**: 32-byte random tokens (`gen_random_bytes(32)`, hex-encoded) generated by Postgres, never by the client. `/manage/[id]` pages verify the token server-side using the admin (service-role) client, since guests have no session for RLS to key off — see the comment in `lib/actions/booking.ts::getManageableAppointment`.
- **Service-role key** never reaches the browser — `lib/supabase/admin.ts` imports the `server-only` package, which makes bundling it into a Client Component a build-time error.
- **Anti-spam on the contact form**: honeypot field + minimum time-on-form, no third-party CAPTCHA dependency (see `lib/actions/contact.ts`).

---

## Testing

```bash
npm test              # Vitest — 38 tests: availability generation, timezone conversion,
                       # overlapping-appointment/buffer logic, group capacity, validation
                       # schemas (including the "server never trusts client price" property),
                       # ICS generation, CSV export, secure-link building
npm run test:e2e       # Playwright — requires a seeded Supabase project and `npm run dev`
```

Behavior that lives only in the database (overlap rejection via the exclusion constraint, waiver requirement, notice/cancellation/reschedule windows, group-capacity joins) was verified directly against Postgres during development rather than duplicated into a JS mock — see [Booking conflict prevention](#booking-conflict-prevention-the-most-important-part). Re-running those checks in CI would mean either a Supabase CLI (Docker) service in the pipeline or `pg_ctl`-based ephemeral Postgres, same approach used locally; not wired into a CI config here since none was requested.

The Playwright spec (`tests/e2e/booking-flow.spec.ts`) covers the full required critical path: select a service → select a slot → enter details → confirm → slot disappears for a second visitor → (optional) admin sees it → client cancels via the secure link.

---

## Future integrations (adapters already in place)

Each of these is a clean interface with a documented no-op implementation — the app works fully without any of them configured:

| Integration | Adapter | Wire it up by |
|---|---|---|
| Email (SendGrid) | `lib/notifications/adapter.ts` | Implementing a class alongside `NoopNotificationAdapter`, returning it from `getNotificationAdapter()` when `SENDGRID_API_KEY` is set |
| SMS (Twilio) | same file | Same pattern, keyed off `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN` |
| Stripe deposits | `lib/payments/adapter.ts` | Implement `PaymentAdapter`; call it from `lib/actions/booking.ts::submitBooking` before the RPC once `STRIPE_SECRET_KEY` is set |
| Google Calendar sync | `lib/calendar-sync/adapter.ts` | Implement `CalendarSyncAdapter`, call from the same booking/cancel actions |

---

## Deployment

### Vercel (app)

1. Push this repo to GitHub and import it in Vercel.
2. Set the environment variables from `.env.example` in the Vercel project settings.
3. Deploy — the default build command (`next build`) and output are already correct.

### Supabase (database + auth)

1. Create a project at [supabase.com](https://supabase.com).
2. `supabase link --project-ref <ref>` then `supabase db push` to apply `supabase/migrations/`.
3. Seed with `npm run db:seed` (set `DATABASE_URL` first) or paste `supabase/seed.sql` into the SQL editor.
4. Promote your account to admin (see [step 4 above](#4-promote-yourself-to-admin)).
5. In Supabase Auth settings, add your production domain to the redirect URL allowlist (used by `/auth/callback`).

---

Built incrementally: schema and the transactional booking engine first (validated against real Postgres before any UI existed), then the public booking flow end-to-end, then the client portal and admin dashboard, then tests.
