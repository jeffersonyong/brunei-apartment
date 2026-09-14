-- The gate takes cash, and the office can book a guest the guard is holding at
-- the barrier (capabilities D6, B17; open question N54, answered).
--
-- Jason answered N54 on 14 September 2026: the security guard and the front
-- desk are the same people. The guard cannot create a booking — he calls the
-- office first — and he sometimes receives pending cash payments, which he
-- must record.
--
-- 1. Security gets `payment.record_cash`. The gate records the cash a guest
--    still owes through the desk's own functions: the security deposit
--    (record_booking_deposit, which also fulfils a transfer promised and never
--    sent), the rest of a short deposit (top_up_booking_deposit), and what is
--    owed on a stay or a day pass (record_cash_payment). Security still has no
--    `payment.verify`, so the guard never says a transfer landed: the two
--    actions that could record a transfer as already seen — a deposit's top-up,
--    and settling what a guest owed beyond the deposit — now also ask for
--    `payment.verify`, in the application layer where every permission is
--    checked (architecture.md §4).
--
-- 2. create_walk_in_booking() takes a third way of paying, `at_gate`: nothing
--    now. The booking is held — `draft --hold-->`, the pair the state machine
--    derives — with no deposit row and no payment, and the guard takes the
--    deposit and then the stay when the guest drives up. It is the one stated
--    exception to prd.md §9.1's "a unit is never held against nothing", and it
--    is held for minutes with the guest at the barrier, so it is refused for a
--    stay not starting today in the property's timezone, and for a booking
--    whose deposit is waived.
--
-- `create or replace` keeps the function's signature and its grants; only the
-- body and its comment change. Jason's project already carries
-- 20260927000100, and `db push` runs no seed, so the grant is made here as
-- well as in seed.sql, as an insert that does nothing on conflict.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. The guard records cash.
-- ═══════════════════════════════════════════════════════════════════════════

insert into role_permission (property_id, role_id, permission)
select r.property_id, r.id, grant_spec.permission
from staff_role r
join (
  values
    ('security', 'payment.record_cash')
) as grant_spec (slug, permission) on grant_spec.slug = r.slug
on conflict do nothing;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. create_walk_in_booking() can leave the money to the gate.
--
-- 20260915000100's body, with `at_gate` accepted. It takes neither the deposit
-- nor the stay, and is refused for any other day and beside a waiver.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function create_walk_in_booking(
  p_property_id uuid,
  p_unit_id uuid,
  p_status text,
  p_check_in date,
  p_check_out date,
  p_guest_name text,
  p_guest_phone text,
  -- Normalised and de-duplicated by the caller. Empty only when p_no_vehicle.
  p_vehicles text[],
  p_no_vehicle boolean,
  p_chargeable_guests integer,
  p_exempt_guests integer,
  p_total_cents integer,
  -- What the engine quoted. Zeroed below when the deposit is waived.
  p_security_deposit_cents integer,
  p_lines jsonb,
  -- How whatever is paid now was paid: cash counted, a transfer promised, or
  -- `at_gate` — nothing now, taken by the guard when the guest arrives.
  p_payment_method text,
  -- Whether the stay is paid now as well as the deposit. Forced true where no
  -- deposit is quoted, since the stay is then the only thing to pay for —
  -- except at the gate, where nothing is paid now.
  p_pay_stay_now boolean,
  -- The instruction, not its effect. Null together when nothing was discounted.
  p_discount_kind text default null,
  p_discount_value integer default null,
  p_discount_reason text default null,
  -- Non-null waives the deposit. Blank is read as no waiver, never as a
  -- waiver with nothing to say.
  p_deposit_waiver_reason text default null,
  p_actor_id uuid default null
)
returns jsonb
language plpgsql
as $function$
declare
  v_guest_id uuid;
  v_booking_id uuid;
  v_payment_id uuid;
  v_deposit_id uuid;
  v_reference text;
  v_is_cash boolean := p_payment_method = 'cash';
  v_at_gate boolean := p_payment_method = 'at_gate';
  v_vehicles text[] := coalesce(p_vehicles, '{}'::text[]);
  v_discount_reason text := nullif(btrim(coalesce(p_discount_reason, '')), '');
  v_waiver_reason text := nullif(btrim(coalesce(p_deposit_waiver_reason, '')), '');
  v_deposit_cents integer :=
    case when v_waiver_reason is null then p_security_deposit_cents else 0 end;
  v_takes_deposit boolean;
  v_pays_stay boolean;
begin
  if p_payment_method not in ('cash', 'bank_transfer', 'at_gate') then
    raise exception 'unknown payment method: %', p_payment_method;
  end if;

  -- Paid at the gate (N54), nothing is taken now — so nothing may be dated
  -- ahead, and nothing may be waived. A unit held against nothing for a later
  -- day is what prd.md §9.1 rules out, and a waived booking has nothing to
  -- secure it but the stay. Raised rather than returned, like the vehicle check
  -- below: a caller that sends either skipped its own validation.
  if v_at_gate then
    if p_check_in is distinct from (
      select (now() at time zone p.time_zone)::date
      from property p
      where p.id = p_property_id
    ) then
      raise exception 'a booking paid at the gate must start today';
    end if;

    if v_waiver_reason is not null then
      raise exception 'a booking paid at the gate cannot waive its deposit';
    end if;
  end if;

  v_takes_deposit := not v_at_gate and coalesce(v_deposit_cents, 0) > 0;
  v_pays_stay := not v_at_gate and (coalesce(p_pay_stay_now, false) or not v_takes_deposit);

  -- prd.md §13 [C]: a vehicle registration is required for records and
  -- security. Raised rather than returned as a refusal, unlike the two below:
  -- those are races a staff member can lose through no fault of their own, and
  -- this is a caller that skipped its own validation.
  if cardinality(v_vehicles) = 0 and not p_no_vehicle then
    raise exception 'a booking needs at least one vehicle registration, or the no-vehicle exception';
  end if;

  -- Same class of refusal, and the same reason for raising rather than
  -- returning. The table constraint would catch it too; this names the caller.
  if p_discount_kind is not null and (p_discount_value is null or v_discount_reason is null) then
    raise exception 'a discount needs a value and a reason';
  end if;

  -- No guest de-duplication. Matching an arriving walk-in to a previous guest
  -- on name or phone is a product decision nobody has made — prd.md says
  -- nothing about it — and silently merging two people who share a number
  -- would be worse than a duplicate row. The guest slice can consolidate.
  insert into guest (property_id, name, phone)
  values (p_property_id, p_guest_name, p_guest_phone)
  returning id into v_guest_id;

  v_reference := next_booking_reference();

  insert into booking (
    property_id, reference, stream, status, guest_id,
    chargeable_guests, exempt_guests, no_vehicle,
    total_cents, security_deposit_cents, deposit_waiver_reason,
    discount_kind, discount_value, discount_reason, created_by
  )
  values (
    p_property_id, v_reference, 'short_stay', p_status, v_guest_id,
    p_chargeable_guests, p_exempt_guests, p_no_vehicle,
    p_total_cents, v_deposit_cents, v_waiver_reason,
    p_discount_kind, p_discount_value, v_discount_reason, p_actor_id
  )
  returning id into v_booking_id;

  insert into booking_vehicle (property_id, booking_id, registration, sort_order)
  select p_property_id, v_booking_id, plate, (ordinality - 1)::integer
  from unnest(v_vehicles) with ordinality as plates (plate, ordinality);

  -- The line that either wins or loses the race.
  insert into occupancy (
    property_id, unit_id, booking_id, occupancy_type, status, start_date, end_date
  )
  values (
    p_property_id, p_unit_id, v_booking_id, 'short_stay', p_status, p_check_in, p_check_out
  );

  insert into booking_line (
    property_id, booking_id, line_type, description,
    quantity, unit_price_cents, amount_cents, sort_order
  )
  select
    p_property_id,
    v_booking_id,
    entry ->> 'type',
    entry ->> 'description',
    (entry ->> 'quantity')::integer,
    (entry ->> 'unitPrice')::integer,
    (entry ->> 'amount')::integer,
    (ordinality - 1)::integer
  from jsonb_array_elements(p_lines) with ordinality as elements (entry, ordinality);

  -- ── The deposit, as the booking is made ──────────────────────────────────
  --
  -- The same two shapes `record_booking_deposit()` writes, in the same
  -- transaction as the booking: cash is money now, so the row is collected
  -- and the booking is secured on the spot; a transfer is a promise, so the
  -- row is written the way the customer's own button writes it and joins the
  -- same queue. The amount is the quoted figure — there is no other. At the
  -- gate there is no row yet: the guard's cash writes it.
  if v_takes_deposit then
    if v_is_cash then
      insert into deposit (
        property_id, booking_id, amount_cents, method, collected_by, collected_at
      )
      values (p_property_id, v_booking_id, v_deposit_cents, 'cash', p_actor_id, now())
      returning id into v_deposit_id;

      insert into audit_event (
        property_id, actor_id, action, entity_type, entity_id, before, after
      )
      values (
        p_property_id, p_actor_id, 'deposit.collected', 'deposit', v_deposit_id,
        null,
        jsonb_build_object(
          'booking_id', v_booking_id,
          'booking_reference', v_reference,
          'amount_cents', v_deposit_cents,
          'method', 'cash',
          'via', 'at_booking'
        )
      );
    else
      insert into deposit (
        property_id, booking_id, amount_cents, method, promised_at, collected_at, collected_by
      )
      values (p_property_id, v_booking_id, v_deposit_cents, 'bank_transfer', now(), null, null)
      returning id into v_deposit_id;

      insert into audit_event (
        property_id, actor_id, action, entity_type, entity_id, before, after
      )
      values (
        p_property_id, p_actor_id, 'deposit.promised', 'deposit', v_deposit_id,
        null,
        jsonb_build_object(
          'booking_id', v_booking_id,
          'booking_reference', v_reference,
          'amount_cents', v_deposit_cents,
          'method', 'bank_transfer',
          'via', 'at_booking'
        )
      );
    end if;
  end if;

  -- ── The stay, when it is paid now ────────────────────────────────────────
  --
  -- The payment's own status is derived here, and that asymmetry with
  -- p_status is deliberate. booking.status is a state machine architecture.md
  -- §5.3 keeps in exactly one place; a payment's initial status is not a
  -- machine at all, it is a property of the method — cash has no bank to
  -- check.
  --
  -- A discounted booking pays the discounted total, which is what
  -- p_total_cents already is: the discount is a line, and the total is the sum
  -- of the lines. Nothing here subtracts anything.
  if v_pays_stay then
    insert into payment (
      property_id, booking_id, method, status,
      expected_amount_cents, amount_cents, match_kind,
      collected_by, collected_at, verified_by, verified_at, created_by
    )
    values (
      p_property_id,
      v_booking_id,
      p_payment_method,
      case when v_is_cash then 'verified' else 'pending_verification' end,
      p_total_cents,
      case when v_is_cash then p_total_cents else null end,
      null,
      case when v_is_cash then p_actor_id else null end,
      case when v_is_cash then now() else null end,
      case when v_is_cash then p_actor_id else null end,
      case when v_is_cash then now() else null end,
      p_actor_id
    )
    returning id into v_payment_id;

    -- The money has its own entry in the trail rather than being a field on
    -- the booking's.
    insert into audit_event (
      property_id, actor_id, action, entity_type, entity_id, before, after
    )
    values (
      p_property_id,
      p_actor_id,
      case when v_is_cash then 'payment.cash_recorded' else 'payment.recorded' end,
      'payment',
      v_payment_id,
      null,
      jsonb_build_object(
        'booking_id', v_booking_id,
        'reference', v_reference,
        'method', p_payment_method,
        'expected_amount_cents', p_total_cents,
        'amount_cents', case when v_is_cash then p_total_cents else null end
      )
    );
  end if;

  -- architecture.md §5.3: every transition writes an audit event, in the same
  -- transaction as the transition itself. The deposit recorded here is what
  -- the booking QUOTES — zero when waived; the waiver's own event below says
  -- what that zero stands in for. `paying` says which of the customer's two
  -- answers the desk gave on their behalf, or that the gate takes it.
  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id,
    p_actor_id,
    'booking.created_walk_in',
    'booking',
    v_booking_id,
    null,
    jsonb_build_object(
      'reference', v_reference,
      'status', p_status,
      'unit_id', p_unit_id,
      'check_in', p_check_in,
      'check_out', p_check_out,
      'total_cents', p_total_cents,
      'security_deposit_cents', v_deposit_cents,
      'payment_method', p_payment_method,
      'paying', case
        when v_at_gate then 'nothing_now'
        when v_takes_deposit and v_pays_stay then 'deposit_and_stay'
        when v_takes_deposit then 'deposit_only'
        else 'stay'
      end,
      'vehicles', to_jsonb(v_vehicles),
      'no_vehicle', p_no_vehicle
    )
  );

  -- A second verb for the discount, alongside the creation event rather than a
  -- field inside it — the same shape verify_payment() uses for an amount
  -- override, and for the same reason: "show me every discount given this
  -- month" is then a lookup on `action` over audit_event_entity_idx instead of
  -- a scan through jsonb.
  if p_discount_kind is not null then
    insert into audit_event (
      property_id, actor_id, action, entity_type, entity_id, before, after
    )
    values (
      p_property_id, p_actor_id, 'booking.discounted', 'booking', v_booking_id,
      null,
      jsonb_build_object(
        'reference', v_reference,
        'kind', p_discount_kind,
        'value', p_discount_value,
        'total_cents', p_total_cents,
        'reason', v_discount_reason
      )
    );
  end if;

  -- And a verb for the waiver, on the same reasoning. Against the BOOKING, not
  -- a deposit: there is no deposit row, and the booking's trail is where a
  -- reader asks "why was nothing taken". `amount_cents` is what would have
  -- been held — the figure the question is actually about.
  if v_waiver_reason is not null then
    insert into audit_event (
      property_id, actor_id, action, entity_type, entity_id, before, after
    )
    values (
      p_property_id, p_actor_id, 'deposit.waived', 'booking', v_booking_id,
      null,
      jsonb_build_object(
        'reference', v_reference,
        'amount_cents', p_security_deposit_cents,
        'reason', v_waiver_reason
      )
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'booking_id', v_booking_id,
    'reference', v_reference,
    'payment_id', v_payment_id,
    'deposit_id', v_deposit_id
  );

exception
  -- The G1 constraint refusing a second booking over the same unit and dates.
  when exclusion_violation then
    return jsonb_build_object('ok', false, 'error', 'unit_unavailable');
  when foreign_key_violation then
    return jsonb_build_object('ok', false, 'error', 'unit_not_found');
end;
$function$;

comment on function create_walk_in_booking(
  uuid, uuid, text, date, date, text, text, text[], boolean,
  integer, integer, integer, integer, jsonb, text, boolean, text, integer, text, text, uuid
) is
  'Creates a booking at the desk in one transaction: guest, booking, vehicles, occupancy, lines, the security deposit (collected in cash or promised by transfer) and, when asked, the payment for the stay — or, paid at the gate, only the hold, for a stay starting today that the guard collects on arrival. The status is the one the state machine derived.';
