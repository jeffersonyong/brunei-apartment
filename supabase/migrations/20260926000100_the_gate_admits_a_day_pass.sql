-- The gate admits a day pass; the desk checks a stay in (capabilities D1–D4;
-- open questions N11, N40, N54).
--
-- 20260924000100 gave the guard `booking.check_in`, so the gate screen could
-- check a stay in. Jeff reopened that on 13 September 2026, and it is in the
-- register for Jason as N54: a guest collects the keys at the counter, and
-- checking in is what tells the system they have the unit — the units board
-- shows it Occupied, the deposit reads "in house", and the booking can no
-- longer be amended. A guard's tap at the barrier recorded all of that before
-- the keys changed hands, and left the desk nothing to record when they did.
--
-- Day passes are the other way round. No keys, no unit, and the gate is the
-- only place staff meet a visitor who paid ahead — so the gate admits them.
-- Admitting closes the pass (`confirmed → completed`), because a pass has no
-- unit to leave and nothing would ever close it later: the reason N40 kept
-- passes off the guard's buttons in the first place.
--
--   booking.check_in   Front Office, Admin            (Security's grant removed)
--   day_pass.admit     Security, Front Office, Admin  (new)
--
-- Removing a grant in a migration overrides whatever an administrator has set
-- in Roles & staff. Nothing is hosted yet, so there is no such choice to
-- override; from the first hosted deploy on, a change like this is a tick in
-- the Roles matrix, not a migration. If Jason says the guard hands over keys
-- after hours, giving Security check-in back is exactly that tick.
--
-- Neither move handles money. check_in_booking() still refuses a booking whose
-- deposit is not held in full; admit_day_pass() refuses a pass that is not
-- paid in full, or not for today.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. The vocabulary grows to twenty-two strings.
--
-- Mirrored by PERMISSIONS in lib/auth/permissions.ts. Granted here as well as
-- in seed.sql because production moves by `db push`, which runs no seed.
-- ═══════════════════════════════════════════════════════════════════════════

alter table role_permission drop constraint role_permission_permission_check;

alter table role_permission add constraint role_permission_permission_check check (
  permission in (
    'booking.view', 'booking.create', 'booking.amend', 'booking.cancel',
    'booking.override_hold', 'booking.discount', 'booking.check_in', 'booking.check_out',
    'day_pass.admit', 'payment.verify', 'payment.record_cash', 'inspection.record',
    'charge.create', 'charge.waive', 'deposit.approve_release', 'deposit.waive',
    'unit.manage', 'tenancy.manage', 'config.manage', 'report.view',
    'document.view_identity', 'site_image.manage'
  )
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Who holds what.
-- ═══════════════════════════════════════════════════════════════════════════

insert into role_permission (property_id, role_id, permission)
select r.property_id, r.id, grant_spec.permission
from staff_role r
join (
  values
    ('admin', 'day_pass.admit'),
    ('front-office', 'day_pass.admit'),
    ('security', 'day_pass.admit')
) as grant_spec (slug, permission) on grant_spec.slug = r.slug
on conflict do nothing;

delete from role_permission rp
using staff_role r
where r.id = rp.role_id
  and r.property_id = rp.property_id
  and r.slug = 'security'
  and rp.permission = 'booking.check_in';

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. check_in_booking() refuses a day pass.
--
-- 20260917000100's body, with one refusal after the row is found. The desk's
-- booking screen offered Check in on a pass, and a pass checked in stayed
-- `checked_in` with no unit to leave. `stream` never changes, so it is asked
-- before the status is.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function check_in_booking(
  p_property_id uuid,
  p_booking_id uuid,
  p_from_status text,
  p_to_status text,
  p_actor_id uuid default null
)
returns jsonb
language plpgsql
as $function$
declare
  v_booking booking%rowtype;
  v_deposit deposit%rowtype;
  v_updated integer;
begin
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

  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id, p_actor_id, 'booking.check_in', 'booking', p_booking_id,
    jsonb_build_object('status', p_from_status),
    case
      when v_deposit.id is null then jsonb_build_object('status', p_to_status)
      else jsonb_build_object(
        'status', p_to_status, 'deposit_id', v_deposit.id, 'deposit', 'already_held'
      )
    end
  );

  return jsonb_build_object(
    'ok', true,
    'status', p_to_status,
    'deposit_id', v_deposit.id,
    'amount_cents', coalesce(v_deposit.amount_cents, 0)
  );
end;
$function$;

comment on function check_in_booking(uuid, uuid, text, text, uuid) is
  'Moves a confirmed stay to checked_in. Collects nothing: a booking quoting a security deposit that is not collected in full is refused, with `promised` and `short` saying which way it failed (prd.md §11, §12). A day pass is refused as `not_a_stay` — it is admitted instead (N54).';

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. transition_booking() does not admit a pass.
--
-- 20260922000100's body, with a second guard at the top. Admission is refused
-- on another day or with money owed, which only admit_day_pass() checks under
-- its lock — so a caller reaching for the generic writer is refused rather
-- than walked around both rules. lib/db narrows the TypeScript signature to
-- match, as it does for cancel and no-show.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function transition_booking(
  p_property_id uuid,
  p_booking_id uuid,
  p_from_status text,
  p_to_status text,
  p_event text,
  p_actor_id uuid default null,
  p_reason text default null
)
returns jsonb
language plpgsql
as $function$
declare
  v_updated integer;
begin
  if p_event in ('cancel', 'mark_no_show') then
    return jsonb_build_object('ok', false, 'error', 'closes_through_close_booking');
  end if;

  if p_event = 'admit' then
    return jsonb_build_object('ok', false, 'error', 'admits_through_admit_day_pass');
  end if;

  update booking
  set status = p_to_status
  where id = p_booking_id
    and property_id = p_property_id
    and status = p_from_status;

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    return jsonb_build_object('ok', false, 'error', 'status_changed');
  end if;

  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id,
    p_actor_id,
    'booking.' || p_event,
    'booking',
    p_booking_id,
    jsonb_build_object('status', p_from_status),
    -- The reason key is omitted rather than null when there is none, so a
    -- transition that never asked for one does not read as one left blank.
    case
      when p_reason is null then jsonb_build_object('status', p_to_status)
      else jsonb_build_object('status', p_to_status, 'reason', p_reason)
    end
  );

  return jsonb_build_object('ok', true, 'status', p_to_status);
end;
$function$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. admit_day_pass() — the gate's move, and the desk's for a pass paid there.
--
-- The status pair is derived by `transition()` in TypeScript and passed in
-- (architecture.md §5.3); this applies it under the booking's row lock after
-- the checks only the database can make at that moment, each refused as a
-- value rather than raised:
--
--   not_found        no such booking on this property
--   not_a_day_pass   a stay — checked in, not admitted
--   status_changed   moved since the caller read it (already admitted, say)
--   not_today        a pass admits one day, in the property's own timezone
--   owed             verified payments short of the total
--
-- **Paid means paid in full**, which the status alone does not prove: a short
-- transfer can be accepted with a reason, and confirm the pass while money is
-- still owed. The sum is `booking_summary.paid_cents`'s — verified payments —
-- so the gate's badge and this refusal cannot disagree. A stay's balance never
-- stops its check-in; a pass's does, because admitting closes the booking and
-- nobody meets a day visitor again to collect the rest.
--
-- Written inline rather than through transition_booking(), for the reason
-- check_in_booking() is: a plpgsql `return` does not roll back, so moving the
-- booking and then refusing would leave it moved.
-- ═══════════════════════════════════════════════════════════════════════════

create function admit_day_pass(
  p_property_id uuid,
  p_booking_id uuid,
  p_from_status text,
  p_to_status text,
  p_actor_id uuid default null
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
begin
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

  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id, p_actor_id, 'booking.admit', 'booking', p_booking_id,
    jsonb_build_object('status', p_from_status),
    jsonb_build_object(
      'status', p_to_status, 'pass_date', v_pass.pass_date, 'headcount', v_pass.headcount
    )
  );

  return jsonb_build_object('ok', true, 'status', p_to_status);
end;
$function$;

comment on function admit_day_pass(uuid, uuid, text, text, uuid) is
  'Admits a day pass at the gate or the desk, closing it (confirmed → completed). Refuses a stay, a pass for another day in the property''s timezone, and a pass not paid in full (N40, N54).';

revoke execute on function admit_day_pass(uuid, uuid, text, text, uuid)
  from public, anon, authenticated;

grant execute on function admit_day_pass(uuid, uuid, text, text, uuid) to service_role;
