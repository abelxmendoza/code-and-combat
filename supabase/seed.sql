-- Starter content for Code & Combat by Abel.
-- Applied automatically by `supabase db reset` / `supabase start` for local
-- dev, and can be run against a hosted project with:
--   supabase db push --include-seed
-- or by pasting into the SQL editor. Prices/durations here are configurable
-- starting points, not permanent — edit via the admin dashboard once live.

-- ---------------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------------

insert into public.services
  (slug, name, short_description, full_description, category, duration_minutes,
   buffer_minutes, price_cents, price_unit, delivery_type, max_participants,
   preparation_instructions, requires_waiver, active, sort_order)
values
  (
    'coding-tutoring',
    'One-on-One Coding Tutoring',
    'Focused help with programming fundamentals, debugging, and Git/GitHub workflows.',
    'A one-on-one session built around whatever you''re stuck on: programming fundamentals, Python or C++ specifics, a stubborn bug, or getting comfortable with Git and GitHub. Bring a laptop with your project or coursework loaded, or come with no code at all and we''ll start from the fundamentals.',
    'code', 60, 15, 4500, 'session', 'online', 1,
    'Have your laptop, a working dev environment, and (if applicable) the repository or assignment you want to work on ready to share your screen.',
    false, true, 1
  ),
  (
    'ai-assisted-development',
    'AI-Assisted Development Session',
    'Learn to use modern AI coding tools effectively, without losing the fundamentals.',
    'Hands-on session on integrating AI coding assistants into a real workflow: prompting for code generation, reviewing and correcting AI output, and knowing when NOT to trust it. Useful for developers who want to move faster without letting the tool think for them.',
    'code', 75, 15, 6000, 'session', 'online', 1,
    'Bring an existing project (or an idea for one) and access to whichever AI tool you already use or want to try.',
    false, true, 2
  ),
  (
    'robotics-ros-mentoring',
    'Robotics / ROS Mentoring',
    'Robotics field-operations experience applied to your ROS project or coursework.',
    'One-on-one mentoring on robotics fundamentals, ROS/ROS2 concepts, and practical field-operations troubleshooting drawn from real robotics work — not just textbook theory. Good for students, hobbyists, and early-career engineers.',
    'code', 60, 15, 6000, 'session', 'hybrid', 1,
    'Let me know your ROS distro and OS ahead of time. For in-person hardware sessions, bring your own board/robot if you have one.',
    false, true, 3
  ),
  (
    'project-portfolio-review',
    'Project & Portfolio Review',
    'A practical, honest review of your codebase, project, or technical portfolio.',
    'Structured feedback on a project, coding portfolio, or resume-adjacent technical work — architecture, code quality, and how it reads to an interviewer or collaborator. You leave with a concrete punch list, not vague encouragement.',
    'code', 45, 10, 4000, 'session', 'online', 1,
    'Share a repository link or portfolio URL at booking time if you can, so the review time is spent talking, not loading.',
    false, true, 4
  ),
  (
    'modern-developer-toolkit-workshop',
    'Modern Developer Toolkit Workshop',
    'Small-group seminar on the day-to-day toolkit of a working developer in 2026.',
    'A small-group workshop covering the practical toolkit of a modern developer: Git workflows, AI-assisted coding, debugging strategy, and dev environment setup. Designed for students and early-career developers who want the tools nobody hands you in a syllabus.',
    'code', 90, 15, 2500, 'person', 'online', 12,
    'A laptop with Git installed. Everything else is covered live.',
    false, true, 5
  ),
  (
    'private-beginner-striking',
    'Private Beginner Striking',
    'One-on-one Muay Thai fundamentals: stance, guard, and the first combinations.',
    'A private lesson built for beginners: stance, guard, footwork, and your first striking combinations, taught at your pace. No experience required, and no pressure to spar. This is fundamentals work, not a tryout.',
    'combat', 60, 15, 5000, 'session', 'in-person', 1,
    'Wear athletic clothing and bring water. Hand wraps and gloves can be provided if you don''t have your own — just ask ahead of time.',
    true, true, 6
  ),
  (
    'pad-work-conditioning',
    'Pad Work & Conditioning',
    'Pad rounds and beginner-friendly conditioning to sharpen technique and output.',
    'Pad-holding rounds paired with beginner-appropriate conditioning work: combinations, defense, and the conditioning that makes them stick. A good fit once you have the fundamentals down and want to build output and cardio.',
    'combat', 60, 15, 5000, 'session', 'in-person', 1,
    'Wear athletic clothing, bring water, and hand wraps if you have them.',
    true, true, 7
  ),
  (
    'small-group-striking',
    'Small-Group Striking Session',
    'Beginner-friendly striking fundamentals in a small outdoor group format.',
    'A small-group outdoor striking session covering the same beginner fundamentals as the private lessons — stance, guard, footwork, combinations — in a lower-cost group format. Capped small so everyone still gets individual correction.',
    'combat', 75, 15, 2000, 'person', 'in-person', 6,
    'Wear athletic clothing and bring water. Sessions run outdoors, weather permitting; you''ll be notified promptly if a session needs to move or reschedule.',
    true, true, 8
  ),
  (
    'dev-discovery-call',
    'Custom Website & App Development — Discovery Call',
    'A free call to scope your website, landing page, or app idea before a written quote.',
    'Available for hire to build custom software: personal websites, business landing pages, small-business sites, or a full web app / MVP for a product idea. This free call is the first step — we talk through what you need, I ask the questions that shape scope and cost, and you leave with a clear next step and a written estimate. No obligation to continue after the call.',
    'code', 30, 15, 0, 'session', 'online', 1,
    'Come with a rough idea of what you want built — even one sentence is enough — plus any reference sites or apps you like the feel of.',
    false, true, 9
  );

insert into public.service_locations (service_id, label, meeting_instructions, is_primary)
select id, 'Video call', 'A video call link is emailed after booking is confirmed.', true
from public.services where delivery_type = 'online';

insert into public.service_locations (service_id, label, meeting_instructions, is_primary)
select id, 'LA / Orange County area', 'Exact address or meeting point is shared after booking, based on your general location.', true
from public.services where delivery_type in ('in-person', 'hybrid');

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
-- Upcoming group workshops / events
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
    'Beginner Striking Fundamentals — Group Session',
    'An outdoor group session covering stance, guard, footwork, and beginner combinations. Beginner-focused; no experience or contact sparring involved.',
    'combat', '2026-09-27 09:00:00-07', 75, 8, 2000, 'person', 'in-person', 'Orange County (exact location shared after registration)', 'scheduled'
  );

-- ---------------------------------------------------------------------------
-- Promote yourself to admin after your first sign-in, e.g.:
--
--   insert into public.user_roles (user_id, role)
--   select id, 'admin' from auth.users where email = 'you@example.com'
--   on conflict do nothing;
-- ---------------------------------------------------------------------------
