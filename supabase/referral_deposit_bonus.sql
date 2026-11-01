-- Run this once in your Supabase project's SQL Editor (after schema.sql,
-- payments_schema.sql, referrals_schema.sql and users_schema.sql). Changes
-- the referral bonus from a flat $1 paid at signup to 10% of the referred
-- user's FIRST successful deposit, paid to the referrer when that deposit
-- clears — nothing is paid if the referred user never deposits, and it
-- never pays out again on their later deposits.

alter table public.profiles add column if not exists referred_by uuid references public.profiles (id);

-- Preserve relationships already recorded under the old (signup-time) bonus
-- system, so a user referred before this migration who hasn't deposited yet
-- still triggers their referrer's deposit-based bonus on their first deposit.
update public.profiles p
  set referred_by = r.referrer_user_id
  from public.referral_usages r
  where p.id = r.referred_user_id and p.referred_by is null;

-- Final version of the signup trigger — same referral-code generation as
-- before, but now only records who referred this account (referred_by);
-- the bonus itself moved into credit_deposit() below.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_referrer_id uuid;
  v_referral_code text;
  v_referred_name text;
begin
  v_referral_code := 'REF' || upper(substr(replace(new.id::text, '-', ''), 1, 8));
  v_referred_name := coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1));

  if new.raw_user_meta_data ->> 'referral_code' is not null then
    select id into v_referrer_id
      from public.profiles
      where referral_code = upper(trim(new.raw_user_meta_data ->> 'referral_code'));
    if v_referrer_id = new.id then
      v_referrer_id := null;
    end if;
  end if;

  insert into public.profiles (id, name, email, referral_code, referred_by)
  values (new.id, v_referred_name, new.email, v_referral_code, v_referrer_id);

  return new;
end;
$$;

-- Final version of credit_deposit() — same idempotent success-flip as
-- before, plus: if the depositing user was referred by someone and this is
-- their first successful deposit, credit the referrer 10% of this deposit's
-- amount and log it (both a transaction and a referral_usages row).
create or replace function public.credit_deposit(p_deposit_id text)
returns table (ok boolean, new_balance numeric)
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid;
  v_amount numeric;
  v_new_balance numeric;
  v_referrer_id uuid;
  v_prior_deposits integer;
  v_bonus numeric;
begin
  if auth.uid() is not null and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    raise exception 'Not authorized';
  end if;

  update public.deposits
    set status = 'success', updated_at = now()
    where id = p_deposit_id and status = 'pending'
    returning user_id, amount into v_user_id, v_amount;

  if v_user_id is null then
    return query select false, null::numeric;
    return;
  end if;

  update public.profiles set balance = balance + v_amount where id = v_user_id returning balance into v_new_balance;

  insert into public.transactions (id, user_id, type, description, amount, status, date)
    values ('txn_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20), v_user_id, 'deposit', 'Deposit ' || p_deposit_id, v_amount, 'completed', now());

  select referred_by into v_referrer_id from public.profiles where id = v_user_id;

  if v_referrer_id is not null then
    select count(*) into v_prior_deposits
      from public.deposits
      where user_id = v_user_id and status = 'success' and id <> p_deposit_id;

    if v_prior_deposits = 0 then
      v_bonus := round(v_amount * 0.10, 2);

      update public.profiles set balance = balance + v_bonus where id = v_referrer_id;

      insert into public.transactions (id, user_id, type, description, amount, status, date)
        values (
          'txn_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20),
          v_referrer_id, 'adjustment', 'Bonus referral 10% — deposit pertama orang yang diundang', v_bonus, 'completed', now()
        );

      insert into public.referral_usages (id, referrer_user_id, referred_user_id, bonus_amount, date)
        values ('ref_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20), v_referrer_id, v_user_id, v_bonus, now());
    end if;
  end if;

  return query select true, v_new_balance;
end;
$$;

revoke all on function public.credit_deposit(text) from public;
grant execute on function public.credit_deposit(text) to authenticated;
