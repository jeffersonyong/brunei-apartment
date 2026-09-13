-- The guard checks a guest in (capabilities D1, D2, D4; open question N11).
--
-- Checking a guest in and out were gated by `booking.amend` from the day the
-- deposits slice made them reachable, as an [A] that said out loud what it
-- cost: Security could not check anybody in, which is what the gate screen
-- exists to do, and granting `booking.amend` to a guard would also have let
-- them change a booking's dates, unit and guest. N11 was answered on
-- 13 September 2026 (Jeff, [A] until Jason confirms): each move gets its own
-- string, held by the role whose job it is.
--
--   booking.check_in   Security, Front Office, Admin
--   booking.check_out  Housekeeping, Front Office, Admin
--
-- Neither handles money. check_in_booking() refuses a booking whose deposit is
-- not held in full (20260915000100, 20260917000100), so the guard can only
-- ever check in a guest the office has already secured — which is what makes
-- the grant a small decision.
--
-- Nothing is revoked. Front Office keeps `booking.amend` for what it means:
-- editing a booking.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. The vocabulary grows to twenty-one strings.
--
-- Mirrored by PERMISSIONS in lib/auth/permissions.ts. Granted here as well as
-- in seed.sql because production moves by `db push`, which runs no seed (the
-- construction 20260910000100 used for `deposit.waive`).
-- ═══════════════════════════════════════════════════════════════════════════

alter table role_permission drop constraint role_permission_permission_check;

alter table role_permission add constraint role_permission_permission_check check (
  permission in (
    'booking.view', 'booking.create', 'booking.amend', 'booking.cancel',
    'booking.override_hold', 'booking.discount', 'booking.check_in', 'booking.check_out',
    'payment.verify', 'payment.record_cash', 'inspection.record', 'charge.create',
    'charge.waive', 'deposit.approve_release', 'deposit.waive', 'unit.manage',
    'tenancy.manage', 'config.manage', 'report.view', 'document.view_identity',
    'site_image.manage'
  )
);

insert into role_permission (property_id, role_id, permission)
select r.property_id, r.id, grant_spec.permission
from staff_role r
join (
  values
    ('admin', 'booking.check_in'),
    ('front-office', 'booking.check_in'),
    ('security', 'booking.check_in'),
    ('admin', 'booking.check_out'),
    ('front-office', 'booking.check_out'),
    ('housekeeping', 'booking.check_out')
) as grant_spec (slug, permission) on grant_spec.slug = r.slug
on conflict do nothing;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Finding a booking that is not on today's list (capability D2).
--
-- The gate screen loads today's arrivals once and filters them on the phone,
-- so a plate typed at the barrier needs no round trip (prd.md §12.5, register
-- C3). This is the other half: the car whose booking starts tomorrow, or the
-- guest who gave the office a different name. Open bookings only — a closed
-- one has nothing to do at a gate.
--
-- A plate is compared on its letters and digits alone, upper-cased, on both
-- sides — `plateKey()` in lib/domain/vehicle.ts is the same rule — so "baa
-- 1234" at the barrier finds "BAA 1234" from the desk. The stored registration
-- is never rewritten; this is a comparison, the arrangement phone numbers
-- have (architecture.md §5.1).
--
-- `strpos`, never `like`: the term is typed by a person, and a `%` or `_` in
-- it must be a character rather than a wildcard.
--
-- Returns ids, not rows. The caller reads `booking_summary` for them, so the
-- gate's rows are shaped in exactly one place.
-- ═══════════════════════════════════════════════════════════════════════════

create function gate_booking_search(
  p_property_id uuid,
  p_term text,
  p_limit integer default 20
)
returns table (booking_id uuid, arrival date)
language sql
stable
as $function$
  with needle as (
    select
      nullif(lower(btrim(coalesce(p_term, ''))), '') as words,
      nullif(regexp_replace(upper(coalesce(p_term, '')), '[^0-9A-Z]', '', 'g'), '') as key
  )
  select b.id, coalesce(o.start_date, dp.pass_date) as arrival
  from booking b
  cross join needle n
  join guest g on g.id = b.guest_id and g.property_id = b.property_id
  left join occupancy o on o.booking_id = b.id and o.property_id = b.property_id
  left join day_pass dp on dp.booking_id = b.id and dp.property_id = b.property_id
  where b.property_id = p_property_id
    and b.status in ('draft', 'held', 'awaiting_payment_verification', 'confirmed', 'checked_in')
    and n.words is not null
    and (
      strpos(lower(g.name), n.words) > 0
      or strpos(lower(b.reference), n.words) > 0
      or (
        n.key is not null
        and (
          strpos(regexp_replace(upper(b.reference), '[^0-9A-Z]', '', 'g'), n.key) > 0
          or exists (
            select 1
            from booking_vehicle bv
            where bv.property_id = b.property_id
              and bv.booking_id = b.id
              and strpos(regexp_replace(upper(bv.registration), '[^0-9A-Z]', '', 'g'), n.key) > 0
          )
        )
      )
    )
  order by coalesce(o.start_date, dp.pass_date) asc nulls last, b.reference
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$function$;

revoke execute on function gate_booking_search(uuid, text, integer)
  from public, anon, authenticated;

grant execute on function gate_booking_search(uuid, text, integer) to service_role;
