-- Run this once in your Supabase project's SQL Editor (after schema.sql).
-- Moves support tickets off per-browser localStorage and into a real
-- table, so a message a user sends from Customer Service actually reaches
-- the admin Customer Service screen (and survives a refresh/different
-- device), and an admin's reply is something that genuinely happened.

create table if not exists public.tickets (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  user_name text not null,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  replies jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tickets_user_id_idx on public.tickets (user_id);

alter table public.tickets enable row level security;

create policy "Users can read their own tickets" on public.tickets for select using (auth.uid() = user_id);
create policy "Admins can read all tickets" on public.tickets for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- A user can open their own ticket directly (no money/atomicity concern
-- here, unlike orders/deposits, so a plain insert policy is enough — no
-- RPC needed).
create policy "Users can create their own tickets" on public.tickets for insert
  with check (auth.uid() = user_id);

-- Only admins can change a ticket afterwards (status + appending a reply).
create policy "Admins can update any ticket" on public.tickets for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
