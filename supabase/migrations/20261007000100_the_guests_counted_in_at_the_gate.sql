-- ═══════════════════════════════════════════════════════════════════════════
-- The guests counted in at the gate (capability D8; Jason's team, 29
-- September 2026).
--
-- A booking's entry code can be scanned again, but only the first Admit or
-- Check in was recorded, and after it the card counted nobody: a 20-person
-- pass once admitted let a forwarded screenshot bring in any number of later
-- groups unnoticed. Now every group is counted against the booking — the
-- first in the Check in or Admit dialog, every one after it with Record
-- arrivals — and the count may go past the booking, because it records who
-- actually came through (Jeff). The app never turns anyone away.
--
--   booking_arrival          one row per booking let in: how many have come
--                            through the gate so far.
--   check_in_booking()       take the count as they are let in; with none,
--   admit_day_pass()         the whole party — the office's check-in and
--                            admission, and every booking let in before this.
--   record_gate_arrivals()   more people through, or a mis-tap corrected,
--                            refused if the count moved since the guard saw it.
--
-- ── Why a table of its own, and why stored ───────────────────────────────
--
-- Stored, because two readers need the figure — the gate's list, and this
-- file's own guard against a count posted twice on a weak signal — and a
-- figure two readers fold out of the trail separately is one that will
-- disagree (the reason day_pass stores `headcount`). Every change to it is
-- still an event, so the booking's history carries each count and each
-- correction.
--
-- Not a column on `booking`, because booking_touch_updated_at fires on any
-- update of it: every count would re-queue the booking's accounting pack,
-- which reads booking.updated_at, and refuse an office Change party or amend
-- form open at the same moment, which holds updated_at as its token. The
-- writers still lock the booking row — `select … for update` fires no trigger
-- — so a count is serialised against check-in, admission and party changes.
--
-- ── Deploying ─────────────────────────────────────────────────────────────
--
-- The build before this one keeps working on this schema: its calls name five
-- arguments and `p_arrived` defaults. The build after it does not work on the
-- schema before this one, so this is pushed the moment the PR merges.
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. booking_arrival
--
-- A row exists from the moment a booking is let in, and never before, so "no
-- row" means "not counted" rather than "nobody came". Zero is a real count:
-- an office check-in counts everyone, and the guard may correct that to
-- nobody through the gate yet.
-- ═══════════════════════════════════════════════════════════════════════════

create table booking_arrival (
  property_id uuid not null references property (id) on delete cascade,
  booking_id uuid not null,

  -- Everybody counted through the gate: may exceed the booking, never below
  -- nothing.
  arrived integer not null check (arrived >= 0),

  primary key (property_id, booking_id),
  foreign key (property_id, booking_id) references booking (property_id, id) on delete cascade
);

comment on table booking_arrival is
  'How many people have come through the gate on a booking, counted by the guard (capability D8). One row from the moment the booking is checked in or admitted; every change is a booking.arrivals_recorded event.';

alter table booking_arrival enable row level security;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Everyone already let in counts as the whole party.
--
-- The rule an office check-in follows from now on, applied to the past:
-- admitting used to mean "check the number of people against the pass" and
-- let them all in, so this asserts nothing new. No booking row is touched, so
-- no accounting pack falls due. A pass is joined to its day_pass row, and one
-- somehow without it is left uncounted rather than failing the push.
-- ═══════════════════════════════════════════════════════════════════════════

insert into booking_arrival (property_id, booking_id, arrived)
select b.property_id, b.id, b.chargeable_guests + b.exempt_guests
from booking b
where b.stream <> 'day_pass'
  and b.status in ('checked_in', 'completed');

insert into booking_arrival (property_id, booking_id, arrived)
select b.property_id, b.id, dp.headcount
from booking b
join day_pass dp on dp.booking_id = b.id and dp.property_id = b.property_id
where b.stream = 'day_pass'
  and b.status in ('checked_in', 'completed');

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. check_in_booking() takes the count.
--
-- 20260926000100's body, with the count written beside the status in the same
-- transaction and named in the event. Dropped rather than replaced: `create or
-- replace` with a sixth argument would leave the five-argument version beside
-- it, and neither PostgREST nor a positional call could choose between them.
-- `p_arrived` is last, so demo.sql's positional call still resolves. The drop
-- takes the grants with it, so they are given again below.
-- ═══════════════════════════════════════════════════════════════════════════

drop function check_in_booking(uuid, uuid, text, text, uuid);

create function check_in_booking(
  p_property_id uuid,
  p_booking_id uuid,
  p_from_status text,
  p_to_status text,
  p_actor_id uuid default null,
  p_arrived integer default null
)
returns jsonb
language plpgsql
as $function$
declare
  v_booking booking%rowtype;
  v_deposit deposit%rowtype;
  v_updated integer;
  v_booked integer;
  v_arrived integer;
  v_after jsonb;
begin
  if p_arrived < 0 then
    raise exception 'check_in_booking: a count is zero or more (%)', p_booking_id;
  end if;

  -- Booking then deposit, the order every function touching both takes.
  select * into v_booking
  from booking
  where id = p_booking_id and property_id = p_property_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  -- A day pass is admitted, never checked in: admit_day_pass() below.
  if v_booking.stream = 'day_pass' then
    return jsonb_build_object('ok', false, 'error', 'not_a_stay');
  end if;

  if v_booking.status <> p_from_status then
    return jsonb_build_object('ok', false, 'error', 'status_changed', 'status', v_booking.status);
  end if;

  select * into v_deposit
  from deposit
  where booking_id = p_booking_id and property_id = p_property_id
  for update;

  -- The refusal. `promised` and `short` tell the screen which of the three
  -- sentences to say: confirm the transfer in the queue or take it in cash;
  -- top up what came in short; or record a deposit nobody has taken.
  if not booking_deposit_is_secured(
       p_property_id, p_booking_id, v_booking.security_deposit_cents
     ) then
    return jsonb_build_object(
      'ok', false,
      'error', 'deposit_not_secured',
      'promised', v_deposit.id is not null and v_deposit.collected_at is null,
      'short', v_deposit.id is not null and v_deposit.collected_at is not null,
      'amount_cents', v_booking.security_deposit_cents,
      'held_cents', coalesce(v_deposit.amount_cents, 0)
    );
  end if;

  update booking
  set status = p_to_status
  where id = p_booking_id
    and property_id = p_property_id
    and status = p_from_status;

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    return jsonb_build_object('ok', false, 'error', 'status_changed', 'status', v_booking.status);
  end if;

  -- Everybody the booking is for, as the gate counts them: the exempt small
  -- ones come through the gate too. No count is the whole party.
  v_booked := v_booking.chargeable_guests + v_booking.exempt_guests;
  v_arrived := coalesce(p_arrived, v_booked);

  -- A plain insert: a stay is checked in once, so a row already here is a bug
  -- to fail on, not a count to overwrite.
  insert into booking_arrival (property_id, booking_id, arrived)
  values (p_property_id, p_booking_id, v_arrived);

  v_after := jsonb_build_object('status', p_to_status, 'arrived', v_arrived, 'booked', v_booked);

  if v_deposit.id is not null then
    v_after := v_after || jsonb_build_object('deposit_id', v_deposit.id, 'deposit', 'already_held');
  end if;

  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id, p_actor_id, 'booking.check_in', 'booking', p_booking_id,
    jsonb_build_object('status', p_from_status),
    v_after
  );

  return jsonb_build_object(
    'ok', true,
    'status', p_to_status,
    'deposit_id', v_deposit.id,
    'amount_cents', coalesce(v_deposit.amount_cents, 0)
  );
end;
$function$;

comment on function check_in_booking(uuid, uuid, text, text, uuid, integer) is
  'Moves a confirmed stay to checked_in and records how many came through the gate — `p_arrived`, or the whole party when it is null (capability D8). Collects nothing: a booking quoting a security deposit that is not collected in full is refused, with `promised` and `short` saying which way it failed (prd.md §11, §12). A day pass is refused as `not_a_stay` — it is admitted instead (N54).';

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. admit_day_pass() takes the count.
--
-- 20260926000100's body, the same way. `booked` joins `headcount` in the
-- event, which is the same figure, so the history reads an admission the way
-- it reads a check-in.
-- ═══════════════════════════════════════════════════════════════════════════

drop function admit_day_pass(uuid, uuid, text, text, uuid);

create function admit_day_pass(
  p_property_id uuid,
  p_booking_id uuid,
  p_from_status text,
  p_to_status text,
  p_actor_id uuid default null,
  p_arrived integer default null
)
returns jsonb
language plpgsql
as $function$
declare
  v_booking booking%rowtype;
  v_pass day_pass%rowtype;
  v_today date;
  v_paid_cents integer;
  v_updated integer;
  v_arrived integer;
begin
  if p_arrived < 0 then
    raise exception 'admit_day_pass: a count is zero or more (%)', p_booking_id;
  end if;

  select * into v_booking
  from booking
  where id = p_booking_id and property_id = p_property_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_booking.stream <> 'day_pass' then
    return jsonb_build_object('ok', false, 'error', 'not_a_day_pass');
  end if;

  select * into v_pass
  from day_pass
  where booking_id = p_booking_id and property_id = p_property_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_a_day_pass');
  end if;

  if v_booking.status <> p_from_status then
    return jsonb_build_object('ok', false, 'error', 'status_changed', 'status', v_booking.status);
  end if;

  select (now() at time zone p.time_zone)::date into v_today
  from property p
  where p.id = p_property_id;

  if v_pass.pass_date <> v_today then
    return jsonb_build_object('ok', false, 'error', 'not_today', 'pass_date', v_pass.pass_date);
  end if;

  select coalesce(sum(p.amount_cents), 0)::integer into v_paid_cents
  from payment p
  where p.booking_id = p_booking_id
    and p.property_id = p_property_id
    and p.status = 'verified';

  if v_paid_cents < v_booking.total_cents then
    return jsonb_build_object('ok', false, 'error', 'owed');
  end if;

  update booking
  set status = p_to_status
  where id = p_booking_id
    and property_id = p_property_id
    and status = p_from_status;

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    return jsonb_build_object('ok', false, 'error', 'status_changed', 'status', v_booking.status);
  end if;

  v_arrived := coalesce(p_arrived, v_pass.headcount);

  -- A plain insert, for check_in_booking()'s reason: a pass is admitted once.
  insert into booking_arrival (property_id, booking_id, arrived)
  values (p_property_id, p_booking_id, v_arrived);

  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id, p_actor_id, 'booking.admit', 'booking', p_booking_id,
    jsonb_build_object('status', p_from_status),
    jsonb_build_object(
      'status', p_to_status,
      'pass_date', v_pass.pass_date,
      'headcount', v_pass.headcount,
      'arrived', v_arrived,
      'booked', v_pass.headcount
    )
  );

  return jsonb_build_object('ok', true, 'status', p_to_status);
end;
$function$;

comment on function admit_day_pass(uuid, uuid, text, text, uuid, integer) is
  'Admits a day pass at the gate or the desk, closing it (confirmed → completed), and records how many came through — `p_arrived`, or the whole pass when it is null (capability D8). Refuses a stay, a pass for another day in the property''s timezone, and a pass not paid in full (N40, N54).';

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. record_gate_arrivals() — more people through, or a mis-tap corrected.
--
-- Both are the same write: the new total, and the total the guard saw when he
-- opened the dialog. If the count has moved since — a second phone, or a
-- press repeated after an answer was lost on one bar of signal — nothing is
-- written and the count as it now stands is handed back, the guard
-- gateCashStalenessOf() gives cash. Refused as values, each worded by
-- lib/domain/gate-arrivals.ts:
--
--   not_found   no such booking on this property
--   closed      a stay checked out, or any booking cancelled, expired or
--               marked no-show
--   not_in      nobody let in yet — a stay not checked in, a pass not
--               admitted, or a booking let in without a count
--   not_today   a pass counts on its own day, in the property's timezone
--   changed     the count moved since the guard saw it
--   unchanged   the count is already that
--
-- The booking row is locked first, as every writer touching it does, then the
-- count's own row. `p_corrected` only changes what the history says.
-- ═══════════════════════════════════════════════════════════════════════════

create function record_gate_arrivals(
  p_property_id uuid,
  p_booking_id uuid,
  p_expected_arrived integer,
  p_arrived integer,
  p_corrected boolean default false,
  p_actor_id uuid default null
)
returns jsonb
language plpgsql
as $function$
declare
  v_booking booking%rowtype;
  v_pass day_pass%rowtype;
  v_today date;
  v_booked integer;
  v_arrived integer;
begin
  if p_arrived is null or p_arrived < 0 then
    raise exception 'record_gate_arrivals: a count is zero or more (%)', p_booking_id;
  end if;

  select * into v_booking
  from booking
  where id = p_booking_id and property_id = p_property_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_booking.status in ('cancelled', 'expired', 'no_show') then
    return jsonb_build_object('ok', false, 'error', 'closed');
  end if;

  if v_booking.stream = 'day_pass' then
    -- Admitting closes a pass, so `completed` is a pass in use; `checked_in`
    -- is the desk's check-in from before passes were admitted.
    if v_booking.status not in ('completed', 'checked_in') then
      return jsonb_build_object('ok', false, 'error', 'not_in');
    end if;

    select * into v_pass
    from day_pass
    where booking_id = p_booking_id and property_id = p_property_id;

    if not found then
      return jsonb_build_object('ok', false, 'error', 'not_in');
    end if;

    select (now() at time zone p.time_zone)::date into v_today
    from property p
    where p.id = p_property_id;

    if v_pass.pass_date <> v_today then
      return jsonb_build_object('ok', false, 'error', 'not_today', 'pass_date', v_pass.pass_date);
    end if;

    v_booked := v_pass.headcount;
  else
    if v_booking.status = 'completed' then
      return jsonb_build_object('ok', false, 'error', 'closed');
    end if;

    if v_booking.status <> 'checked_in' then
      return jsonb_build_object('ok', false, 'error', 'not_in');
    end if;

    v_booked := v_booking.chargeable_guests + v_booking.exempt_guests;
  end if;

  select a.arrived into v_arrived
  from booking_arrival a
  where a.property_id = p_property_id and a.booking_id = p_booking_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_in');
  end if;

  if v_arrived <> p_expected_arrived then
    return jsonb_build_object(
      'ok', false, 'error', 'changed', 'arrived', v_arrived, 'booked', v_booked
    );
  end if;

  if p_arrived = v_arrived then
    return jsonb_build_object(
      'ok', false, 'error', 'unchanged', 'arrived', v_arrived, 'booked', v_booked
    );
  end if;

  update booking_arrival
  set arrived = p_arrived
  where property_id = p_property_id and booking_id = p_booking_id;

  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id, p_actor_id, 'booking.arrivals_recorded', 'booking', p_booking_id,
    jsonb_build_object('arrived', v_arrived),
    -- `corrected` is omitted rather than false when it is not one, as a
    -- transition's `reason` is.
    case
      when p_corrected then
        jsonb_build_object('arrived', p_arrived, 'booked', v_booked, 'corrected', true)
      else jsonb_build_object('arrived', p_arrived, 'booked', v_booked)
    end
  );

  return jsonb_build_object('ok', true, 'arrived', p_arrived, 'booked', v_booked);
end;
$function$;

comment on function record_gate_arrivals(uuid, uuid, integer, integer, boolean, uuid) is
  'Sets how many people have come through the gate on a booking already let in — more arrivals, or a correction — refusing if the count moved since the caller read it (capability D8). Writes a booking.arrivals_recorded event with both sides.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. Grants. Service-role only, like every other writer.
-- ═══════════════════════════════════════════════════════════════════════════

revoke all on booking_arrival from public, anon, authenticated;
grant select, insert, update, delete on booking_arrival to service_role;

revoke execute on function check_in_booking(uuid, uuid, text, text, uuid, integer)
  from public, anon, authenticated;
revoke execute on function admit_day_pass(uuid, uuid, text, text, uuid, integer)
  from public, anon, authenticated;
revoke execute on function record_gate_arrivals(uuid, uuid, integer, integer, boolean, uuid)
  from public, anon, authenticated;

grant execute on function check_in_booking(uuid, uuid, text, text, uuid, integer) to service_role;
grant execute on function admit_day_pass(uuid, uuid, text, text, uuid, integer) to service_role;
grant execute on function record_gate_arrivals(uuid, uuid, integer, integer, boolean, uuid)
  to service_role;
