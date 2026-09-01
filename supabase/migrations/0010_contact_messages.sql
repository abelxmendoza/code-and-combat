-- Contact form submissions. Anti-spam is handled in the server action
-- (honeypot field + a lightweight time-on-form check) before insert, not in
-- the database — see lib/actions/contact.ts.

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  inquiry_type text not null default 'general' check (
    inquiry_type in ('code', 'combat', 'workshop', 'development', 'general')
  ),
  preferred_contact_method text not null default 'email' check (
    preferred_contact_method in ('email', 'phone')
  ),
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);

create index contact_messages_status_idx on public.contact_messages(status);
create index contact_messages_created_at_idx on public.contact_messages(created_at desc);

alter table public.contact_messages enable row level security;

create policy "Contact messages are admin-readable"
  on public.contact_messages for select using (public.is_admin());
create policy "Contact messages are admin-manageable"
  on public.contact_messages for update using (public.is_admin());
create policy "Anyone can submit a contact message"
  on public.contact_messages for insert with check (true);

grant insert on public.contact_messages to anon, authenticated;
