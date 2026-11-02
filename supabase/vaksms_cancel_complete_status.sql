-- Run this once in your Supabase project's SQL Editor (after
-- vaksms_cancel_refund.sql). cancel_own_order already correctly withholds
-- the refund once an SMS code has been received — but it still labeled the
-- order "cancelled" either way, which is wrong: a number that delivered its
-- code was used successfully, not cancelled. This makes the function mark
-- it "completed" instead whenever otp is already set, and still "cancelled"
-- when it isn't (unchanged). The app already has full support for a
-- "completed" order status (Badge, Orders tab, stats) — nothing else needs
-- to be touched for this to show up correctly everywhere.

drop function if exists public.cancel_own_order(text);

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
  -- `otp` on the right-hand side of SET refers to each row's value before
  -- this update, so the single statement stays atomic (same CAS guarantee
  -- as before: only a 'pending'/'active' row matches, and Postgres' row
  -- lock means a second concurrent call finds nothing left to update).
  update public.orders
    set status = case when otp is not null then 'completed' else 'cancelled' end,
        status_history = status_history || jsonb_build_array(jsonb_build_object('status', case when otp is not null then 'completed' else 'cancelled' end, 'at', v_now))
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
