-- Run this once in your Supabase project's SQL Editor (after schema.sql and
-- catalog_schema.sql). Moves balance/deposits/transactions off per-browser
-- localStorage and into real tables, so a server-side payment webhook (which
-- has no browser to write to) can credit a user's balance for real, and so
-- that balance is consistent across every device/browser the user logs in
-- from — the same problem the catalog migration solved for Buy Number.

alter table public.profiles add column if not exists balance numeric not null default 0;

-- The original self-update policy (`using (auth.uid() = id)`, no column
-- restriction) let any logged-in user update ANY column of their own row,
-- including `role` — a privilege-escalation hole that becomes a money hole
-- too now that `balance` lives on the same table. Replace it with a
-- column-scoped grant: only `name` stays directly writable by a user;
-- `role` and `balance` are only ever changed by the security-definer RPCs
-- below (or the service-role webhook), never by a direct table write.
drop policy if exists "Users can update their own profile" on public.profiles;
revoke update on public.profiles from authenticated;
grant update (name) on public.profiles to authenticated;
create policy "Users can update their own name"
  on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

create table if not exists public.deposits (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric not null,
  currency text not null default 'usd',
  method text not null,
  provider text,
  provider_payment_id text,
  pay_currency text,
  pay_amount numeric,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists deposits_provider_payment_id_idx
  on public.deposits (provider_payment_id)
  where provider_payment_id is not null;

alter table public.deposits enable row level security;

create policy "Users can read their own deposits" on public.deposits for select using (auth.uid() = user_id);
create policy "Admins can read all deposits" on public.deposits for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- No insert/update policy for `authenticated` — deposit rows are only ever
-- written by the service-role create-invoice/webhook routes, or by the
-- security-definer RPCs below. A client can never write a deposit directly.

create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('deposit', 'purchase', 'refund', 'adjustment')),
  description text not null,
  amount numeric not null,
  status text not null default 'completed' check (status in ('completed', 'pending', 'failed')),
  date timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Users can read their own transactions" on public.transactions for select using (auth.uid() = user_id);
create policy "Admins can read all transactions" on public.transactions for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- No insert/update policy for `authenticated` either — every transaction is
-- written atomically alongside its balance change, inside one of the three
-- RPCs below. There is deliberately no standalone "add a transaction"
-- entry point, so a transaction can never exist without a matching balance
-- change (or vice versa).

-- Self-service balance debit (number purchases). Only lets a user spend
-- their OWN balance, and only if they actually have enough.
create or replace function public.debit_own_balance(p_amount numeric, p_description text)
returns numeric
language plpgsql
security definer set search_path = public
as $$
declare
  v_new_balance numeric;
begin
  if p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;

  update public.profiles
    set balance = balance - p_amount
    where id = auth.uid() and balance >= p_amount
    returning balance into v_new_balance;

  if v_new_balance is null then
    raise exception 'Insufficient balance';
  end if;

  insert into public.transactions (id, user_id, type, description, amount, status, date)
    values ('txn_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20), auth.uid(), 'purchase', p_description, -p_amount, 'completed', now());

  return v_new_balance;
end;
$$;

revoke all on function public.debit_own_balance(numeric, text) from public;
grant execute on function public.debit_own_balance(numeric, text) to authenticated;

-- Admin-initiated balance adjustment (grant/deduct for any user). Checks
-- the caller is an admin itself, so it's safe to expose to `authenticated`
-- and call directly from the admin's own browser session.
create or replace function public.admin_adjust_balance(p_user_id uuid, p_delta numeric, p_reason text)
returns numeric
language plpgsql
security definer set search_path = public
as $$
declare
  v_new_balance numeric;
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    raise exception 'Not authorized';
  end if;

  update public.profiles
    set balance = balance + p_delta
    where id = p_user_id
    returning balance into v_new_balance;

  if v_new_balance is null then
    raise exception 'User not found';
  end if;

  insert into public.transactions (id, user_id, type, description, amount, status, date)
    values ('txn_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20), p_user_id, 'adjustment', p_reason, p_delta, 'completed', now());

  return v_new_balance;
end;
$$;

revoke all on function public.admin_adjust_balance(uuid, numeric, text) from public;
grant execute on function public.admin_adjust_balance(uuid, numeric, text) to authenticated;

-- Idempotent deposit resolution — flips a deposit from pending to
-- success/failed exactly once (the `where status = 'pending'` guard makes a
-- second call a safe no-op), crediting balance and writing the matching
-- transaction atomically with the status flip. Called either by the
-- service-role webhook (bypasses RLS/grants entirely) or by an admin's own
-- authenticated session (manual approval of a non-crypto deposit) — the
-- admin-role check only applies when the caller isn't already
-- service-role, since a service-role request has no `auth.uid()` to check.
create or replace function public.credit_deposit(p_deposit_id text)
returns table (ok boolean, new_balance numeric)
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid;
  v_amount numeric;
  v_new_balance numeric;
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

  return query select true, v_new_balance;
end;
$$;

revoke all on function public.credit_deposit(text) from public;
grant execute on function public.credit_deposit(text) to authenticated;

create or replace function public.fail_deposit(p_deposit_id text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_updated_id text;
begin
  if auth.uid() is not null and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    raise exception 'Not authorized';
  end if;

  update public.deposits
    set status = 'failed', updated_at = now()
    where id = p_deposit_id and status = 'pending'
    returning id into v_updated_id;

  return v_updated_id is not null;
end;
$$;

revoke all on function public.fail_deposit(text) from public;
grant execute on function public.fail_deposit(text) to authenticated;
