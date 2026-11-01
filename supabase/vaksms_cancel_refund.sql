-- Run this once in your Supabase project's SQL Editor (after
-- vaksms_numbers.sql). cancel_own_order previously never refunded — this
-- makes it refund the user's balance when they cancel (or the order
-- auto-expires) BEFORE any SMS code was ever received, since no code means
-- the number was never actually usable. If a code was already delivered,
-- the service was used, so cancelling afterward still doesn't refund —
-- same as before.
--
-- Double-refund safety: the refund lives inside the same single UPDATE
-- that flips status to 'cancelled', guarded by
-- `where status in ('pending', 'active')`. Postgres locks that row for the
-- duration of the update, so if two cancel calls race (e.g. a user's manual
-- click landing at the same moment the UI's auto-expire timer fires), only
-- the first one sees a matching row and performs the refund — the second
-- finds the order already 'cancelled' and does nothing. This is the same
-- compare-and-swap pattern credit_deposit() already uses to stay idempotent.

-- Postgres won't let create-or-replace change a function's return type
-- (boolean -> table here), so the old signature has to be dropped first.
drop function if exists public.cancel_own_order(text);

-- new_balance is only non-null when a refund actually happened (no SMS
-- ever received) — the client treats a null new_balance as "cancelled,
-- balance unchanged" and skips updating the displayed balance.
create function public.cancel_own_order(p_order_id text)
returns table (ok boolean, new_balance numeric)
language plpgsql
security definer set search_path = public
as $$
declare
  v_order record;
  v_new_balance numeric;
  v_now timestamptz := now();
begin
  update public.orders
    set status = 'cancelled',
        status_history = status_history || jsonb_build_array(jsonb_build_object('status', 'cancelled', 'at', v_now))
    where id = p_order_id and user_id = auth.uid() and status in ('pending', 'active')
    returning id, price, otp into v_order;

  if v_order.id is null then
    return query select false, null::numeric;
    return;
  end if;

  if v_order.otp is null then
    update public.profiles set balance = balance + v_order.price where id = auth.uid() returning balance into v_new_balance;
    insert into public.transactions (id, user_id, type, description, amount, status, date)
      values ('txn_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20), auth.uid(), 'refund', 'Number cancelled before SMS received — refund', v_order.price, 'completed', v_now);
  end if;

  return query select true, v_new_balance;
end;
$$;

revoke all on function public.cancel_own_order(text) from public;
grant execute on function public.cancel_own_order(text) to authenticated;
