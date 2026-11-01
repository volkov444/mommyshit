-- Run this once in your Supabase project's SQL Editor (after schema.sql and
-- payments_schema.sql). Makes referral codes and their bonus real: every
-- profile gets a stable code, and signing up with someone else's code
-- credits the referrer atomically with the new account's own creation.

alter table public.profiles add column if not exists referral_code text;

-- Backfill rows that predate this column — new rows get theirs from the
-- trigger below.
update public.profiles
  set referral_code = 'REF' || upper(substr(replace(id::text, '-', ''), 1, 8))
  where referral_code is null;

alter table public.profiles alter column referral_code set not null;
create unique index if not exists profiles_referral_code_idx on public.profiles (referral_code);

create table if not exists public.referral_usages (
  id text primary key,
  referrer_user_id uuid not null references public.profiles (id) on delete cascade,
  referred_user_id uuid not null references public.profiles (id) on delete cascade,
  bonus_amount numeric not null,
  date timestamptz not null default now()
);

alter table public.referral_usages enable row level security;

create policy "Users can read referrals they made" on public.referral_usages for select using (auth.uid() = referrer_user_id);
create policy "Admins can read all referrals" on public.referral_usages for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- No insert/update policy for `authenticated` — rows are only ever written
-- by handle_new_user below, alongside the referrer's bonus and its matching
-- transaction, atomically with the new account's own creation.

-- Replaces the original signup trigger (schema.sql) to also: generate this
-- account's own referral code, and — if it was referred by someone else's
-- code (passed through signUp's options.data.referral_code) — credit that
-- referrer a fixed bonus and log the referral, all in the same transaction
-- as the account being created. $1 is a placeholder bonus; tune v_bonus to
-- whatever the business actually wants to pay out.
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

  insert into public.profiles (id, name, referral_code)
  values (new.id, v_referred_name, v_referral_code);

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
