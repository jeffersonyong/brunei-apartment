-- The unit made ready (capabilities C1, C2, C3; finishing B8).
--
-- Housekeeping's phone screen needs three facts the building did not keep, and
-- one it kept wrongly:
--
--   1. When a unit was made ready after a stay — two write-once columns on the
--      inspection, beside the facts readiness follows.
--   2. When the building started keeping that — a date on the property, so a
--      stay that ended before today's release never reads as a unit waiting
--      for an inspection nobody was ever going to record.
--   3. The last stay in each unit, which unit_state() now returns beside the
--      occupancy covering the day, so the board can say *awaiting inspection*
--      and *cleaning* (prd.md §6.4) instead of calling an uncleaned unit
--      available.
--
-- And the fact kept wrongly: unit_state() counted a stay as covering its unit
-- only while `end_date > today`, so a guest still checked in on the day they
-- leave — or staying past it — read as an empty, available unit on the board.
-- The last stay is what fixes it: while it is `checked_in`, the unit is
-- occupied whatever its dates say.
--
-- ── What this does not change (D-3, Jeff, 13 September 2026) ───────────────
--
-- Nothing that decides whether a unit can be sold or a guest checked in.
-- available_units(), the exclusion constraint, check_in_booking() and every
-- other reader of the occupancy predicate (architecture.md §5.2) are
-- untouched. *Ready* is a status on the units board and the cleaner's phone,
-- not a gate: a unit nobody has marked ready can still be booked and checked
-- into, and one marked ready after an early departure still cannot be sold for
-- the nights the guest paid for and did not use — check-out never shortens a
-- stay. Whether readiness should hold back the next check-in is
-- open-questions.md N53, put to Jason.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Readiness is written once, on the inspection.
--
-- On the inspection rather than on the unit, because it is a fact about one
-- stay's turnover: "3B-04 was made ready after PV-4821". A column on the unit
-- would be the stored `unit.status` architecture.md §5.1 refuses, and would say
-- only what is true now.
--
-- Write-once the way a deposit release is: no update path in lib/db, and
-- mark_unit_ready() refuses a second write under the inspection's row lock.
-- `ready_by` is nullable for the same reason every actor column is — a demo
-- seed has no actor — so there is no "is whole" constraint pairing it with
-- `ready_at`.
-- ═══════════════════════════════════════════════════════════════════════════

alter table inspection
  add column ready_at timestamptz,
  add column ready_by uuid references auth.users (id);

alter table inspection add constraint inspection_ready_follows_inspection check (
  ready_at is null or ready_at >= inspected_at
);

-- The old comment promised photographs "with the documents slice", which
-- landed on 7 September 2026.
comment on table inspection is
  'One per stay (prd.md §11). Photographs are document rows of kind inspection_photo pointing here (20260907000100). ready_at / ready_by are written once, by mark_unit_ready().';

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. The day the building started keeping turnovers.
--
-- Every stay that ended before this release is completed and uninspected as far
-- as the database knows — the spreadsheet recorded the cleaning, this schema
-- never did. Without a cutoff the board would open on every one of them as
-- awaiting inspection, and the only way to clear them would be to invent
-- inspections nobody made. So a stay that ended before this date is simply not
-- a turnover; one that ended on or after it is.
--
-- A `date`, not a timestamp: it is compared with stay end dates, which are
-- dates in the property's timezone. Filled per property in that timezone, then
-- made not null — with no default at any point, which is what architecture.md
-- §5.1 drops its policy defaults for: a default would hand this property's
-- cutoff to the next one silently.
-- ═══════════════════════════════════════════════════════════════════════════

alter table property add column turnover_tracked_since date;

update property set turnover_tracked_since = (now() at time zone time_zone)::date;

alter table property alter column turnover_tracked_since set not null;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. unit_state() carries the last stay.
--
-- Dropped and recreated rather than replaced, because `create or replace`
-- cannot widen a `returns table` (20260904000200 did the same). The covering
-- and upcoming laterals are unchanged from 20260922000100; what is new is
-- `last_stay` and the property's tracking date.
--
-- The last stay is the most recent booking occupancy in the unit that a guest
-- actually arrived for — `checked_in` or `completed` — and that has begun. At
-- most one per start date, because the exclusion constraint forbids two stays
-- overlapping, so ordering by start is a total order.
--
-- **Only for today.** Asked about another day, the last stay comes back empty
-- and the board reads the covering occupancy alone, as before. A guest's being
-- checked in *now* says nothing about next Tuesday, and an inspection recorded
-- this morning says nothing about last month; the turnover facts are facts
-- about the present, and applying them to another date would be inventing a
-- history.
--
-- The status is still not decided here — deriveUnitStatus() in
-- lib/domain/unit-status.ts turns these facts into one, for the reasons that
-- file gives.
-- ═══════════════════════════════════════════════════════════════════════════

drop function unit_state(uuid, date);

create function unit_state(
  p_property_id uuid,
  p_as_of date default null
)
returns table (
  unit_id uuid,
  ref text,
  unit_type_slug text,
  unit_type_name text,
  out_of_service_since date,
  out_of_service_reason text,
  notes text,
  occupancy_id uuid,
  occupancy_status text,
  occupancy_type text,
  start_date date,
  end_date date,
  occupant_name text,
  booking_id uuid,
  booking_reference text,
  next_start_date date,
  turnover_tracked_since date,
  last_occupancy_id uuid,
  last_status text,
  last_booking_id uuid,
  last_reference text,
  last_guest_name text,
  last_start_date date,
  last_end_date date,
  last_inspection_id uuid,
  last_inspection_outcome text,
  last_ready_at timestamptz
)
language sql
stable
as $function$
  with as_of as (
    select
      coalesce(p_as_of, (now() at time zone p.time_zone)::date) as day,
      (p_as_of is null or p_as_of = (now() at time zone p.time_zone)::date) as is_today,
      p.turnover_tracked_since
    from property p
    where p.id = p_property_id
  )
  select
    u.id,
    u.ref,
    ut.slug,
    ut.name,
    u.out_of_service_since,
    u.out_of_service_reason,
    u.notes,
    live.id,
    live.status,
    live.occupancy_type,
    live.start_date,
    live.end_date,
    live.occupant_name,
    live.booking_id,
    live.reference,
    upcoming.start_date,
    as_of.turnover_tracked_since,
    last_stay.id,
    last_stay.status,
    last_stay.booking_id,
    last_stay.reference,
    last_stay.guest_name,
    last_stay.start_date,
    last_stay.end_date,
    last_stay.inspection_id,
    last_stay.outcome,
    last_stay.ready_at
  from unit u
  join unit_type ut on ut.id = u.unit_type_id
  cross join as_of
  left join lateral (
    select
      o.id,
      o.status,
      o.occupancy_type,
      o.start_date,
      o.end_date,
      o.booking_id,
      b.reference,
      coalesce(g.name, o.occupant_name) as occupant_name
    from occupancy o
    left join booking b on b.id = o.booking_id
    left join guest g on g.id = b.guest_id
    where o.unit_id = u.id
      and o.status not in ('expired', 'cancelled', 'no_show')
      and o.start_date <= as_of.day
      -- Null means "no last day yet", which covers today and every day after.
      and (o.end_date is null or o.end_date > as_of.day)
    limit 1
  ) live on true
  left join lateral (
    select min(o.start_date) as start_date
    from occupancy o
    where o.unit_id = u.id
      and o.status not in ('expired', 'cancelled', 'no_show')
      and o.start_date > as_of.day
  ) upcoming on true
  left join lateral (
    select
      o.id,
      o.status,
      o.booking_id,
      b.reference,
      g.name as guest_name,
      o.start_date,
      o.end_date,
      i.id as inspection_id,
      i.outcome,
      i.ready_at
    from occupancy o
    join booking b on b.id = o.booking_id
    left join guest g on g.id = b.guest_id
    left join inspection i on i.occupancy_id = o.id and i.property_id = o.property_id
    where as_of.is_today
      and o.unit_id = u.id
      and o.booking_id is not null
      and o.status in ('checked_in', 'completed')
      and o.start_date <= as_of.day
    order by o.start_date desc
    limit 1
  ) last_stay on true
  where u.property_id = p_property_id
  order by u.ref;
$function$;

revoke execute on function unit_state(uuid, date) from public, anon, authenticated;
grant execute on function unit_state(uuid, date) to service_role;

-- The last-stay lateral walks one unit's stays newest first and stops at the
-- first. Partial on `booking_id`, because a lease is never a last stay.
create index occupancy_unit_last_stay_idx
  on occupancy (unit_id, start_date desc)
  where booking_id is not null;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. mark_unit_ready() — the cleaner's last step (capability C3).
--
-- Keyed by booking, like record_inspection(), because every screen that shows
-- a turnover holds the stay it follows. Validate-then-write with refusals as
-- values, in the order a person would hit them:
--
--   not_found              the booking has gone
--   booking_not_completed  the guest has not checked out
--   no_occupancy           a day pass — nothing to make ready
--   not_inspected          D-3's [A]: ready follows an inspection, never
--                          replaces one, or the deposit release would lose the
--                          record it is approved against
--   already_ready          written once, no undo in v1
--   superseded             the next guest has already checked in, so this
--                          stay's turnover is over whether or not anyone said so
--
-- The inspection row is locked, so two phones tapping Mark ready at once
-- produce one write and one `already_ready`. The superseded check is not
-- locked against a concurrent check-in and does not need to be: the worst a
-- race produces is a readiness mark on a stay whose unit someone moved into a
-- moment later, which changes nothing a guest or a booking depends on (D-3).
--
-- The audit event is the unit's rather than the inspection's, because the
-- unit's page is where "why was 3B-04 cleaning all afternoon" is asked.
-- ═══════════════════════════════════════════════════════════════════════════

create function mark_unit_ready(
  p_property_id uuid,
  p_booking_id uuid,
  p_actor_id uuid default null
)
returns jsonb
language plpgsql
as $function$
declare
  v_booking booking%rowtype;
  v_occupancy occupancy%rowtype;
  v_inspection inspection%rowtype;
  v_unit_ref text;
begin
  -- Read without a lock: readiness requires `completed`, which is terminal
  -- (lib/domain/booking-state.ts), so the status cannot move away underneath
  -- this check — the same reasoning approve_deposit_release() gives.
  select * into v_booking
  from booking
  where id = p_booking_id and property_id = p_property_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_booking.status <> 'completed' then
    return jsonb_build_object(
      'ok', false, 'error', 'booking_not_completed', 'status', v_booking.status
    );
  end if;

  select * into v_occupancy
  from occupancy
  where booking_id = p_booking_id and property_id = p_property_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'no_occupancy');
  end if;

  select * into v_inspection
  from inspection
  where occupancy_id = v_occupancy.id and property_id = p_property_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_inspected');
  end if;

  if v_inspection.ready_at is not null then
    return jsonb_build_object('ok', false, 'error', 'already_ready');
  end if;

  if exists (
    select 1
    from occupancy o
    where o.unit_id = v_occupancy.unit_id
      and o.property_id = p_property_id
      and o.booking_id is not null
      and o.id <> v_occupancy.id
      and o.status in ('checked_in', 'completed')
      and o.start_date > v_occupancy.start_date
  ) then
    return jsonb_build_object('ok', false, 'error', 'superseded');
  end if;

  update inspection
  set ready_at = now(), ready_by = p_actor_id
  where id = v_inspection.id and property_id = p_property_id;

  select ref into v_unit_ref
  from unit
  where id = v_occupancy.unit_id and property_id = p_property_id;

  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id, p_actor_id, 'unit.marked_ready', 'unit', v_occupancy.unit_id,
    null,
    jsonb_build_object(
      'booking_id', p_booking_id,
      'booking_reference', v_booking.reference,
      'inspection_id', v_inspection.id,
      'outcome', v_inspection.outcome,
      'unit_ref', v_unit_ref
    )
  );

  return jsonb_build_object('ok', true, 'unit_ref', v_unit_ref);
end;
$function$;

revoke execute on function mark_unit_ready(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function mark_unit_ready(uuid, uuid, uuid) to service_role;
