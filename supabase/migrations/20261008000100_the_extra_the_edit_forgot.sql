-- A booking's lines name the extra they sell (capability F13).
--
-- ── The bug ────────────────────────────────────────────────────────────────
--
-- 20261003000100 gave `booking_line` an `extra_id`, and made it required on an
-- extra's line (`booking_line_extra_id_matches_type`). Every writer learned to
-- put it there. The one reader every screen goes through did not:
-- `booking_summary` builds each booking's `lines` from five keys, and the id
-- was never one of them. So a booking read back from the database carries a
-- "Sofa bed × 1" line that names no extra, and two writers that start from
-- what was read broke:
--
--   - **Edit booking** prefills the extras from the lines
--     (`extrasFromLines`, lib/domain/lines.ts), keyed on the id. It found
--     none, showed 0 of everything, and a save that touched only the dates
--     quietly dropped what the guest had bought.
--   - **Change party** keeps the lines it was handed and re-prices only the
--     extra-person charge (lib/domain/pricing/party-change.ts).
--     `change_booking_party()` writes them back with `extra_id` taken from
--     the line, which was null, and the check refused the row — so the party
--     of any stay holding an extra could not be changed at all.
--
-- ── The fix ────────────────────────────────────────────────────────────────
--
-- The view's last definition (20260913000100), column for column, with one
-- expression changed: an extra's line gains `extraId`. Every other line has no
-- such key rather than a null one, which is the shape `BookingLine` already
-- declares (`extraId?: string`). Same columns in the same order, so
-- `create or replace` is legal and nothing that reads the view changes.

create or replace view booking_summary
with (security_invoker = true)
as
select
  b.id,
  b.property_id,
  b.reference,
  b.status,
  b.stream,
  g.name as guest_name,
  g.phone as guest_phone,
  b.chargeable_guests,
  b.exempt_guests,
  b.total_cents,
  b.security_deposit_cents,
  b.hold_expires_at,
  b.created_at,
  b.updated_at,
  b.no_vehicle,
  o.unit_id,
  u.ref as unit_ref,
  ut.slug as unit_type_slug,
  o.start_date as check_in,
  o.end_date as check_out,
  coalesce(l.lines, '[]'::jsonb) as lines,
  coalesce(v.vehicles, '[]'::jsonb) as vehicles,
  b.discount_kind,
  b.discount_value,
  b.discount_reason,
  coalesce(pay.paid_cents, 0)::integer as paid_cents,
  b.deposit_waiver_reason,
  g.email as guest_email,
  dp.pass_date,
  dp.headcount as pass_headcount,
  b.access_token
from booking b
join guest g on g.id = b.guest_id
left join occupancy o on o.booking_id = b.id
left join unit u on u.id = o.unit_id
left join unit_type ut on ut.id = u.unit_type_id
left join day_pass dp on dp.booking_id = b.id
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'type', bl.line_type,
      'description', bl.description,
      'quantity', bl.quantity,
      'unitPrice', bl.unit_price_cents,
      'amount', bl.amount_cents
    )
    || case
      when bl.extra_id is null then '{}'::jsonb
      else jsonb_build_object('extraId', bl.extra_id)
    end
    order by bl.sort_order
  ) as lines
  from booking_line bl
  where bl.booking_id = b.id
) l on true
left join lateral (
  select jsonb_agg(bv.registration order by bv.sort_order) as vehicles
  from booking_vehicle bv
  where bv.booking_id = b.id
) v on true
left join lateral (
  select sum(p.amount_cents) as paid_cents
  from payment p
  where p.booking_id = b.id and p.status = 'verified'
) pay on true;

-- A replaced view keeps its grants; restated so this file says on its own who
-- may read it (20260901000100).
revoke all on booking_summary from public, anon, authenticated;
grant select on booking_summary to service_role;
