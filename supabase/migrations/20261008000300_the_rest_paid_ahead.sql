-- A guest who sent only the deposit tells us they have transferred the rest
-- (capability A12, Jason's team, 8 October 2026; open-questions.md N61).
--
-- "Just the deposit" told the guest the stay is settled on arrival, and
-- nothing let them send it sooner: their page took one transfer, and a second
-- slip replaced the deposit's. The desk could already raise a stay transfer for
-- them (record_transfer_payment(), capability B13), but only if the guest rang
-- up to say so. This is the same row, raised by the guest from their own link.
--
-- ── Why not record_transfer_payment() ─────────────────────────────────────
--
-- It is the desk's: it takes a booking id, which a guest never holds, and it
-- asks nothing about the booking's state, because a member of staff raising a
-- transfer has already looked at the booking. A guest's link reaches it with
-- none of that judgement, so this asks under the booking's lock everything the
-- page asked before showing the button:
--
--   - **A short stay with a deposit row**, awaiting verification or
--     confirmed: the guest has told us about the deposit and has not arrived.
--     A day pass and a stay quoting no deposit are paid in one transfer.
--   - **Not on the day of arrival or after** (Jeff, 8 October 2026). That day
--     the guard takes it at the gate (D6); a transfer sent that morning would
--     still be waiting to be checked when the car came.
--   - **No transfer already waiting**, counted under the lock, as
--     record_transfer_payment() counts it: two pending rows for one stay is
--     the same money in the queue twice.
--   - **Something still owed, and exactly what the page showed.** The guest
--     sends the figure their page stated, so a booking the desk repriced or
--     settled between the page loading and the press is refused with what is
--     owed now, rather than raising a row for a figure the guest never saw.
--
-- It raises the whole of what is owed — never part of it — so this is the
-- stated policy (a stay is paid in full) happening sooner, not N16.
--
-- ── The bell ───────────────────────────────────────────────────────────────
--
-- The office is told the same way as for "I have made the transfer": the
-- bell reads booking events (lib/domain/notifications.ts), so beside the
-- payment's own `payment.recorded` this writes `booking.balance_submitted`
-- on the booking, carrying the amount. No email: a guest hears from us twice
-- per booking and never a third time (prd.md §13).

create function submit_public_balance_transfer(
  p_property_id uuid,
  p_access_token text,
  p_expected_cents integer
)
returns jsonb
language plpgsql
as $function$
declare
  v_booking booking%rowtype;
  v_check_in date;
  v_today date;
  v_due integer;
  v_pending integer;
  v_payment_id uuid;
begin
  select * into v_booking
  from booking
  where property_id = p_property_id and access_token = p_access_token
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_booking.status in ('completed', 'expired', 'cancelled', 'no_show') then
    return jsonb_build_object('ok', false, 'error', 'booking_closed');
  end if;

  if v_booking.stream <> 'short_stay'
    or v_booking.status not in ('awaiting_payment_verification', 'confirmed')
    or not exists (
      select 1 from deposit d
      where d.booking_id = v_booking.id and d.property_id = p_property_id
    )
  then
    return jsonb_build_object('ok', false, 'error', 'not_offered');
  end if;

  select o.start_date into v_check_in
  from occupancy o
  where o.booking_id = v_booking.id and o.property_id = p_property_id;

  select (now() at time zone p.time_zone)::date into v_today
  from property p
  where p.id = p_property_id;

  if v_check_in is null or v_check_in <= v_today then
    return jsonb_build_object('ok', false, 'error', 'arrival_day');
  end if;

  select count(*) into v_pending
  from payment p
  where p.booking_id = v_booking.id
    and p.property_id = p_property_id
    and p.status = 'pending_verification';

  if v_pending > 0 then
    return jsonb_build_object('ok', false, 'error', 'already_pending');
  end if;

  select v_booking.total_cents - coalesce(sum(p.amount_cents), 0)::integer
  into v_due
  from payment p
  where p.booking_id = v_booking.id
    and p.property_id = p_property_id
    and p.status = 'verified';

  if v_due <= 0 then
    return jsonb_build_object('ok', false, 'error', 'nothing_outstanding');
  end if;

  if p_expected_cents is distinct from v_due then
    return jsonb_build_object('ok', false, 'error', 'changed', 'due_cents', v_due);
  end if;

  -- No amount: `payment_verified_is_observed` keeps it null until a person
  -- has seen the money, the rule submit_public_payment() writes under too.
  insert into payment (
    property_id, booking_id, method, status,
    expected_amount_cents, amount_cents, match_kind, created_by
  )
  values (
    p_property_id, v_booking.id, 'bank_transfer', 'pending_verification',
    v_due, null, null, null
  )
  returning id into v_payment_id;

  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id, null, 'payment.recorded', 'payment', v_payment_id,
    null,
    jsonb_build_object(
      'booking_id', v_booking.id,
      'reference', v_booking.reference,
      'method', 'bank_transfer',
      'expected_amount_cents', v_due,
      'amount_cents', null,
      'by', 'customer'
    )
  );

  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id, null, 'booking.balance_submitted', 'booking', v_booking.id,
    null,
    jsonb_build_object(
      'reference', v_booking.reference,
      'payment_id', v_payment_id,
      'amount_cents', v_due
    )
  );

  return jsonb_build_object(
    'ok', true,
    'payment_id', v_payment_id,
    'reference', v_booking.reference,
    'amount_cents', v_due
  );
end;
$function$;

revoke execute on function submit_public_balance_transfer(uuid, text, integer)
  from public, anon, authenticated;
grant execute on function submit_public_balance_transfer(uuid, text, integer) to service_role;
