-- Starter content for Code & Combat by Abel.
-- Applied automatically by `supabase db reset` / `supabase start` for local
-- dev, and can be run against a hosted project with:
--   supabase db push --include-seed
-- or by pasting into the SQL editor.
--
-- Exactly four primary customer-facing offers, on purpose — see
-- lib/data/offers.ts for the single source of truth this file mirrors:
--   1. Coding & Tech Tutoring (private session, this table)
--   2. Private Striking Training (private session, this table)
--   3. Group Workshop (instances live in group_events, below)
--   4. Four-Session Package (purchased at booking time, no seed row —
--      see the purchase_session_package() function)
-- Prices/durations are configurable starting points — edit via the admin
-- dashboard once live, not by hand-editing this file after go-live.

-- ---------------------------------------------------------------------------
-- Services (the two private, 1:1 offers)
-- ---------------------------------------------------------------------------

insert into public.services
  (slug, name, short_description, full_description, category, duration_minutes,
   buffer_minutes, price_cents, price_unit, delivery_type, max_participants,
   preparation_instructions, requires_waiver, active, sort_order)
values
  (
    'coding-tutoring',
    'Coding & Tech Tutoring',
    'Programming fundamentals, debugging, Git/GitHub, AI coding tools, robotics, and ROS.',
    'A one-on-one session built around whatever you''re working on: programming fundamentals, debugging, Git/GitHub workflows, AI-assisted coding tools, robotics, ROS, or a project you want a second set of eyes on. Tell us briefly what you want help with when you book, so the time is used well. Available online or in person.',
    'code', 60, 15, 5000, 'session', 'hybrid', 1,
    'Have your laptop, a working dev environment, and (if applicable) the repository or assignment you want to work on ready to share your screen.',
    false, true, 1
  ),
  (
    'private-striking-training',
    'Private Striking Training',
    'Beginner Muay Thai fundamentals: footwork, defense, combinations, pad work, and conditioning.',
    'A private, beginner-focused lesson: stance, guard, footwork, defensive movement, striking combinations, pad work, and conditioning, taught at your pace. No experience required, and no pressure to spar — this is fundamentals instruction, not a tryout, and not medical advice.',
    'combat', 60, 15, 5000, 'session', 'in-person', 1,
    'Wear athletic clothing and bring water. Hand wraps and gloves can be provided if you don''t have your own — just ask ahead of time.',
    true, true, 2
  );

-- Hybrid coding tutoring gets both a video-call and an in-person location,
-- so book_appointment() can pick the one matching whichever delivery type
-- the client actually chose. Striking is in-person only.
insert into public.service_locations (service_id, label, meeting_instructions, is_primary, delivery_type)
select id, 'Video call', 'A video call link is emailed after booking is confirmed.', true, 'online'
from public.services where slug = 'coding-tutoring';

insert into public.service_locations (service_id, label, meeting_instructions, is_primary, delivery_type)
select id, 'LA / Orange County area', 'Exact address or meeting point is shared after booking, based on your general location.', false, 'in-person'
from public.services where slug = 'coding-tutoring';

insert into public.service_locations (service_id, label, meeting_instructions, is_primary, delivery_type)
select id, 'LA / Orange County area', 'Exact address or meeting point is shared after booking, based on your general location.', true, 'in-person'
from public.services where slug = 'private-striking-training';

-- ---------------------------------------------------------------------------
-- Recurring weekly availability (business timezone: America/Los_Angeles)
-- ---------------------------------------------------------------------------

insert into public.availability_rules (day_of_week, start_time, end_time, category, active) values
  (1, '17:00', '21:00', 'code', true),   -- Monday evenings
  (2, '17:00', '21:00', 'code', true),   -- Tuesday evenings
  (3, '17:00', '21:00', 'code', true),   -- Wednesday evenings
  (4, '17:00', '21:00', 'code', true),   -- Thursday evenings
  (2, '18:00', '20:00', 'combat', true), -- Tuesday evening striking
  (4, '18:00', '20:00', 'combat', true), -- Thursday evening striking
  (6, '08:00', '13:00', 'combat', true), -- Saturday morning
  (0, '09:00', '12:00', 'combat', true); -- Sunday morning

-- ---------------------------------------------------------------------------
-- Upcoming group workshops — $25/person, 90 min by default. One coding
-- seminar and one beginner striking class, showing the format applies to
-- both categories.
-- ---------------------------------------------------------------------------

insert into public.group_events
  (slug, title, description, category, start_time, duration_minutes, capacity,
   price_cents, price_unit, delivery_type, location, status)
values
  (
    'ai-pair-programming-bootcamp-2026-09',
    'Modern Developer Toolkit: AI Pair-Programming Bootcamp',
    'A live, small-group walkthrough of building a real feature end-to-end with AI-assisted tools — from prompt to reviewed, working code.',
    'code', '2026-09-20 18:00:00-07', 90, 12, 2500, 'person', 'online', null, 'scheduled'
  ),
  (
    'beginner-striking-group-2026-09',
    'Beginner Striking Fundamentals — Group Class',
    'A group class covering stance, guard, footwork, and beginner combinations. Beginner-focused; no experience or contact sparring involved.',
    'combat', '2026-09-27 09:00:00-07', 90, 8, 2500, 'person', 'in-person', 'Orange County (exact location shared after registration)', 'scheduled'
  );

-- ---------------------------------------------------------------------------
-- Promote yourself to admin after your first sign-in, e.g.:
--
--   insert into public.user_roles (user_id, role)
--   select id, 'admin' from auth.users where email = 'you@example.com'
--   on conflict do nothing;
-- ---------------------------------------------------------------------------
