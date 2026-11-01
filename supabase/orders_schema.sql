-- Run this once in your Supabase project's SQL Editor (after schema.sql and
-- payments_schema.sql). Moves orders off per-browser localStorage and into
-- a real table, so a purchase is visible across every device a user logs in
-- from, and admin's order management reflects every user's real order
-- history — the same problem the catalog/payments migrations solved.

create table if not exists public.orders (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  service_id text not null,
  service_name text not null,
  country_code text not null,
  country_name text not null,
  country_flag text not null,
  phone_number text not null,
  price numeric not null,
  supplier_price numeric not null,
  otp text,
  status text not null default 'active' check (status in ('pending', 'active', 'completed', 'cancelled', 'failed')),
  status_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);

alter table public.orders enable row level security;

create policy "Users can read their own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Admins can read all orders" on public.orders for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- No insert/update policy for `authenticated` — orders are only ever
-- written by the purchase_number RPC (atomically with the balance debit)
-- or the admin_update_order_status RPC below. A client can never write an
-- order row directly.

-- Runs the whole Buy Number purchase atomically: debits the buyer's own
-- balance (via debit_own_balance, which also logs the matching transaction
-- — see payments_schema.sql) and records the order row in the same
-- function call, so an order can never exist without its balance having
-- actually been charged.
create or replace function public.purchase_number(
  p_order_id text,
  p_service_id text,
  p_service_name text,
  p_country_code text,
  p_country_name text,
  p_country_flag text,
  p_phone_number text,
  p_price numeric,
  p_supplier_price numeric
)
returns numeric
language plpgsql
security definer set search_path = public
as $$
declare
  v_new_balance numeric;
  v_now timestamptz := now();
begin
  v_new_balance := public.debit_own_balance(p_price, p_service_name || ' number — ' || p_country_name);

  insert into public.orders (
    id, user_id, service_id, service_name, country_code, country_name, country_flag,
    phone_number, price, supplier_price, otp, status, status_history, created_at
  ) values (
    p_order_id, auth.uid(), p_service_id, p_service_name, p_country_code, p_country_name, p_country_flag,
    p_phone_number, p_price, p_supplier_price, null, 'active',
    jsonb_build_array(jsonb_build_object('status', 'active', 'at', v_now)), v_now
  );

  return v_new_balance;
end;
$$;

revoke all on function public.purchase_number(text, text, text, text, text, text, text, numeric, numeric) from public;
grant execute on function public.purchase_number(text, text, text, text, text, text, text, numeric, numeric) to authenticated;

-- Admin-only order status change (e.g. marking an order completed/failed
-- after review). Checks the caller is an admin itself, same pattern as
-- admin_adjust_balance — safe to expose to `authenticated` and call
-- directly from the admin's own browser session. Never touches balance,
-- mirroring the previous local-store behavior (a status change alone never
-- refunds — cancelling/failing an order is not wired to a refund flow).
create or replace function public.admin_update_order_status(p_order_id text, p_status text, p_note text default null)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_updated_id text;
  v_now timestamptz := now();
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    raise exception 'Not authorized';
  end if;

  if p_status not in ('pending', 'active', 'completed', 'cancelled', 'failed') then
    raise exception 'Invalid status';
  end if;

  update public.orders
    set status = p_status,
        status_history = status_history || jsonb_build_array(
          jsonb_strip_nulls(jsonb_build_object('status', p_status, 'at', v_now, 'note', p_note))
        )
    where id = p_order_id
    returning id into v_updated_id;

  return v_updated_id is not null;
end;
$$;

revoke all on function public.admin_update_order_status(text, text, text) from public;
grant execute on function public.admin_update_order_status(text, text, text) to authenticated;
