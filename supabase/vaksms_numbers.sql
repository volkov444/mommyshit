-- Run this once in your Supabase project's SQL Editor (after schema.sql,
-- catalog_schema.sql, payments_schema.sql and orders_schema.sql). Wires Buy
-- Number up to VAK-SMS for real: renting an actual number on purchase,
-- polling the actual received SMS code, and releasing the number on cancel
-- — instead of the dummy generated number/honest "not connected" stubs used
-- until now.

-- The VAK-SMS service code (e.g. "wa", "ya") needed to call their getNumber
-- API — captured from the catalog import response but never persisted
-- until now. Tiers imported before this migration will have this null;
-- re-import their catalog (Admin > Supplier > Lihat Katalog) to backfill it,
-- otherwise purchases for those tiers fail with a clear "not connected to
-- supplier" message rather than silently using the wrong code.
alter table public.price_tiers add column if not exists supplier_service_code text;

-- VAK-SMS's own activation id for a rented number (their `idNum`) — needed
-- to poll for the SMS code or release the number later.
alter table public.orders add column if not exists supplier_order_id text;

-- Final version of purchase_number() — adds p_supplier_order_id (appended
-- with a default so existing callers without it still work) alongside the
-- same atomic debit + order insert as before.
create or replace function public.purchase_number(
  p_order_id text,
  p_service_id text,
  p_service_name text,
  p_country_code text,
  p_country_name text,
  p_country_flag text,
  p_phone_number text,
  p_price numeric,
  p_supplier_price numeric,
  p_supplier_order_id text default null
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
    phone_number, price, supplier_price, otp, status, status_history, created_at, supplier_order_id
  ) values (
    p_order_id, auth.uid(), p_service_id, p_service_name, p_country_code, p_country_name, p_country_flag,
    p_phone_number, p_price, p_supplier_price, null, 'active',
    jsonb_build_array(jsonb_build_object('status', 'active', 'at', v_now)), v_now, p_supplier_order_id
  );

  return v_new_balance;
end;
$$;

revoke all on function public.purchase_number(text, text, text, text, text, text, text, numeric, numeric, text) from public;
grant execute on function public.purchase_number(text, text, text, text, text, text, text, numeric, numeric, text) to authenticated;

-- Self-service cancel (the user's own order, not admin). Never refunds —
-- same "status change alone never refunds" rule as admin_update_order_status.
create or replace function public.cancel_own_order(p_order_id text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_updated_id text;
  v_now timestamptz := now();
begin
  update public.orders
    set status = 'cancelled',
        status_history = status_history || jsonb_build_array(jsonb_build_object('status', 'cancelled', 'at', v_now))
    where id = p_order_id and user_id = auth.uid() and status in ('pending', 'active')
    returning id into v_updated_id;

  return v_updated_id is not null;
end;
$$;

revoke all on function public.cancel_own_order(text) from public;
grant execute on function public.cancel_own_order(text) to authenticated;
