-- Run this once in your Supabase project's SQL Editor.
-- Mirrors each auth.users row into a profiles row that the app can read
-- (name + role). Everything else (balance, orders, pricing, ...) stays in
-- the local demo stores for now — this table only backs Login & Daftar.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-creates a profiles row whenever someone signs up, pulling the name
-- out of the signUp() options.data payload (falls back to the email's
-- local part if it's ever missing).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- To make an account an admin after it signs up, run:
--   update public.profiles set role = 'admin' where id = '<user-uuid-from-auth-users>';
