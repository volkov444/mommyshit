-- Run this once in your Supabase project's SQL Editor (after schema.sql,
-- payments_schema.sql and referrals_schema.sql). Makes the admin Users page
-- real: profiles now carries email + status directly, so the browser admin
-- client can read every real registered user via the same admin-read-all
-- pattern already used for deposits/transactions/orders — no server-side
-- API route needed. A "blocked" status actually prevents that account from
-- completing login (enforced in src/lib/auth.ts), not just a cosmetic flag.

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists status text not null default 'active' check (status in ('active', 'blocked'));

-- Backfill rows that predate the email column from auth.users — new rows
-- get theirs from the trigger below. Run as the SQL Editor's postgres role,
-- which can read auth.users.
update public.profiles p
  set email = u.email
  from auth.users u
  where p.id = u.id and p.email is null;

alter table public.profiles alter column email set not null;
create index if not exists profiles_email_idx on public.profiles (lower(email));

-- Admins need to read every profile (not just their own) for the Users
-- page — schema.sql only ever granted self-read. A plain
-- `exists (select 1 from public.profiles ...)` USING clause here would be
-- self-referential (a policy ON profiles querying profiles) and Postgres
-- detects that as infinite recursion (42P17) — so the admin check has to
-- run through a security-definer function, which bypasses RLS internally
-- and breaks the cycle.
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles" on public.profiles for select
  using (public.is_admin());

-- Final version of the signup trigger (schema.sql created it,
-- referrals_schema.sql added referral-code generation + bonus crediting) —
-- this adds email, keeping everything else unchanged (status defaults to
-- 'active' via the column default above, so nothing to add here for it).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_referrer_id uuid;
  v_referral_code text;
  v_referred_name text;
  v_bonus numeric := 1;
begin
  v_referral_code := 'REF' || upper(substr(replace(new.id::text, '-', ''), 1, 8));
  v_referred_name := coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1));

  insert into public.profiles (id, name, email, referral_code)
  values (new.id, v_referred_name, new.email, v_referral_code);

  if new.raw_user_meta_data ->> 'referral_code' is not null then
    select id into v_referrer_id
      from public.profiles
      where referral_code = upper(trim(new.raw_user_meta_data ->> 'referral_code'));

    if v_referrer_id is not null and v_referrer_id <> new.id then
      update public.profiles set balance = balance + v_bonus where id = v_referrer_id;

      insert into public.transactions (id, user_id, type, description, amount, status, date)
        values (
          'txn_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20),
          v_referrer_id, 'adjustment', 'Bonus referral — mengundang ' || v_referred_name, v_bonus, 'completed', now()
        );

      insert into public.referral_usages (id, referrer_user_id, referred_user_id, bonus_amount, date)
        values ('ref_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20), v_referrer_id, new.id, v_bonus, now());
    end if;
  end if;

  return new;
end;
$$;

-- Admin-only status change (block/activate). Same pattern as
-- admin_adjust_balance — checks the caller is an admin itself, safe to
-- call directly from the admin's own browser session. status has no
-- column grant for `authenticated` (only `name` does, see
-- payments_schema.sql), so this RPC is the only way to change it.
create or replace function public.admin_set_user_status(p_user_id uuid, p_status text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_updated_id uuid;
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    raise exception 'Not authorized';
  end if;

  if p_status not in ('active', 'blocked') then
    raise exception 'Invalid status';
  end if;

  update public.profiles set status = p_status where id = p_user_id returning id into v_updated_id;
  return v_updated_id is not null;
end;
$$;

revoke all on function public.admin_set_user_status(uuid, text) from public;
grant execute on function public.admin_set_user_status(uuid, text) to authenticated;
