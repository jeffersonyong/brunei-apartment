-- Seed: the property, its unit types, its units, and the predefined roles.
--
-- architecture.md §10 defines the local environment as "Supabase CLI local
-- stack; seed script creates the property, unit types, units, facilities,
-- roles." Applied by `npm run db:reset`, which drops the database, replays
-- every migration and runs this.
--
-- ── What is NOT in here, and why ───────────────────────────────────────────
--
-- No bookings, in THIS file. The demo bookings that populated the portal's list
-- screens lived in lib/db/demo-seed.ts and were deleted with the fixture layer;
-- a seed that invented guests would put fictional people in a real database.
-- That still holds for anything the property itself is made of, which is what
-- this file seeds.
--
-- Local development gets its bookings from ./seeds/demo.sql, loaded after this
-- one and only ever by `supabase db reset` against the CLI stack. Its header
-- explains what keeps the distinction honest: scenario-named DEMO guests
-- rather than invented people, and every row written through
-- create_walk_in_booking() rather than inserted, so it is data the application
-- could have produced. Drop it from config.toml's `sql_paths` to work against
-- the empty states instead.
--
-- Nothing invented. Every number below is a [C] value from prd.md, except the
-- unit references, which are flagged where they appear.
--
-- ── What moved out of this file (capability F3, 20260912000100) ────────────
--
-- The day-pass bands and bundles, the facilities, the bank accounts and the
-- document retention periods are all seeded by seed_property_settings() at the
-- foot of this file rather than written out here. One copy, called from two
-- places: this seed, and the migration that backfills a database which already
-- has a property. The retention rows are why — they lived only here, so every
-- deployed database had none and attach_document() refused every upload.

insert into property (
  name,
  pax_policy,
  extra_person_per_night_cents,
  pax_exempt_age_max,
  early_check_in_per_hour_cents,
  late_check_out_per_hour_cents,
  check_in_time,
  check_out_time,
  security_deposit_cents,
  max_advance_booking_days,
  turnover_tracked_since
)
values (
  'Palm Villa',
  -- [A] prd.md §18 N2: stated max pax is read as the threshold above which the
  -- BND 7 extra-person charge applies, not as a refusal. The only reading under
  -- which the confirmed charge is ever chargeable; one value flips it.
  'surcharge_threshold',
  700,
  3,
  1000,
  1500,
  -- [C] 14:00 / 12:00, answering N6 on 10 September 2026.
  '14:00',
  '12:00',
  10000,
  62,
  -- [A] The day turnovers start being kept (20260925000100): a stay that ended
  -- before it never reads as awaiting inspection. Today, on a fresh database.
  (now() at time zone 'Asia/Brunei')::date
);

-- Unit types (prd.md §7.1, all rates [C]).
--
-- These figures are duplicated in lib/domain/config.ts, which is still the
-- pricing engine's source of truth: that module also holds the values with no
-- database home yet — the TODO(client) fields covering prd.md §18 N2, N3 and
-- N8. Moving PropertyConfig wholesale into the database is a later
-- slice. Until then lib/db/inventory.test.ts asserts these rows and
-- palmVillaConfig agree, so the two copies cannot drift silently.
--
-- max_pax is stored without prejudice to prd.md §18 N2: the number is the same
-- whether it turns out to be a hard cap or the threshold above which the BND 7
-- extra-person charge applies. Only its meaning is open, and that lives in
-- `paxPolicy`.
insert into unit_type (property_id, slug, name, base_rate_cents, max_pax, car_parks)
select
  p.id,
  spec.slug,
  spec.name,
  spec.base_rate_cents,
  spec.max_pax,
  spec.car_parks
from property p
cross join (
  values
    -- prd.md §7.1 states "4 adults + 2 children" for the 2-bedroom alone.
    ('two-bedroom', '2-bedroom', 18000, 6, 2),
    ('three-bedroom', '3-bedroom', 20000, 8, 2),
    ('four-bedroom', '4-bedroom', 25000, 10, 2),
    ('semi-detached', 'Semi-detached', 32000, 20, 4)
) as spec (slug, name, base_rate_cents, max_pax, car_parks);

-- Units — 48 of them, and only the 48 that prd.md §7.1 confirms.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- TODO(client): prd.md §18 N1 — how many 2-bedroom units are there, and does
-- the 48-unit total still hold?
--
-- The 2-bedroom type is seeded with ZERO units. Its rate is confirmed so the
-- type exists and prices correctly, but its unit count is [O] and the fixture
-- layer's invented 4 does not reach a real database. Answering N1 is one
-- INSERT; inventing a number now would put a figure nobody agreed into the
-- system of record and quietly make it true.
--
-- TODO(client): the unit reference scheme below is PROVISIONAL. Nothing in
-- prd.md records how units are labelled on the doors, so `3B-01` is a
-- placeholder that makes units distinguishable on screen, not the building's
-- numbering. Added to prd.md §18 as an open question.
-- ═══════════════════════════════════════════════════════════════════════════
insert into unit (property_id, unit_type_id, ref)
select
  ut.property_id,
  ut.id,
  spec.ref_prefix || '-' || lpad(n::text, 2, '0')
from (
  values
    ('three-bedroom', '3B', 36),
    ('four-bedroom', '4B', 6),
    ('semi-detached', 'SD', 6)
) as spec (slug, ref_prefix, unit_count)
join unit_type ut on ut.slug = spec.slug
cross join lateral generate_series(1, spec.unit_count) as n;

-- Predefined roles (prd.md §4).
--
-- v1 ships a fixed set, each pre-assigned a permission set, and a user may hold
-- more than one — which is what makes the uncertain team structure a non-issue
-- rather than a blocker. Roles and their permissions are editable in the admin
-- UI later without a code change, so nothing below is load-bearing on the shape
-- of the team.
insert into staff_role (property_id, slug, name)
select p.id, spec.slug, spec.name
from property p
cross join (
  values
    ('admin', 'Admin'),
    ('front-office', 'Front Office'),
    ('housekeeping', 'Housekeeping'),
    ('security', 'Security'),
    ('finance', 'Finance')
) as spec (slug, name);

-- Admin holds everything, including config.manage and document.view_identity.
insert into role_permission (property_id, role_id, permission)
select r.property_id, r.id, permission
from staff_role r
cross join unnest(array[
  'booking.view', 'booking.create', 'booking.amend', 'booking.cancel',
  'booking.override_hold', 'booking.discount', 'booking.check_in', 'booking.check_out',
  'day_pass.admit', 'payment.verify', 'payment.record_cash', 'inspection.record',
  'charge.create', 'charge.waive', 'deposit.approve_release', 'deposit.waive',
  'unit.manage', 'tenancy.manage', 'config.manage', 'report.view',
  'document.view_identity', 'site_image.manage', 'faq.manage', 'privacy_policy.manage'
]) as permission
where r.slug = 'admin';

-- Front Office holds `tenancy.manage` because declaring a unit leased
-- long-term (capability B9) is a commercial statement rather than an
-- operational one, and prd.md §4 gives Housekeeping `unit.manage` "(status
-- only)" — the desk marks a lease, the cleaner does not.
--
-- It checks guests in and out and admits day passes too, so the office can do
-- anything the gate does (N54).
insert into role_permission (property_id, role_id, permission)
select r.property_id, r.id, permission
from staff_role r
cross join unnest(array[
  'booking.view', 'booking.create', 'booking.amend', 'booking.cancel',
  'booking.override_hold', 'booking.discount', 'booking.check_in', 'booking.check_out',
  'day_pass.admit', 'payment.verify', 'payment.record_cash', 'charge.create',
  'deposit.waive', 'unit.manage', 'tenancy.manage', 'document.view_identity'
]) as permission
where r.slug = 'front-office';

-- Housekeeping records the inspection; a separate role approves the release
-- (prd.md §4 [C]). Its booking view is read-only, which `booking.view` is. It
-- checks a departing guest out when it finds the unit empty with the keys left
-- in it — in the ordinary case the guard takes the keys back and checks them
-- out (N54) — and never checks one in.
insert into role_permission (property_id, role_id, permission)
select r.property_id, r.id, permission
from staff_role r
cross join unnest(array[
  'booking.view', 'booking.check_out', 'inspection.record', 'unit.manage'
]) as permission
where r.slug = 'housekeeping';

-- ── Security ───────────────────────────────────────────────────────────────
-- The guard is the front desk (N54, answered by Jason on 14 September 2026):
-- the guard hands the keys over, so checks a stay in, and takes them back, so
-- checks it out. The gate admits day passes too (20260926000100), and takes
-- the cash a guest still owes — the deposit, the stay, a day pass — recorded
-- under the guard's name (20260927000200). No move takes money on its own:
-- check_in_booking() refuses a booking whose deposit is not held in full, and
-- admit_day_pass() a pass not paid in full. No `payment.verify`, so the guard
-- never says a transfer landed; no document access; and nothing here creates
-- or edits a booking — the guard calls the office for that. Housekeeping keeps
-- check-out as well, for the guest who leaves the keys in the unit.
insert into role_permission (property_id, role_id, permission)
select r.property_id, r.id, permission
from staff_role r
cross join unnest(array[
  'booking.view', 'booking.check_in', 'booking.check_out', 'day_pass.admit',
  'payment.record_cash'
]) as permission
where r.slug = 'security';

insert into role_permission (property_id, role_id, permission)
select r.property_id, r.id, permission
from staff_role r
cross join unnest(array[
  'booking.view', 'payment.verify', 'deposit.approve_release',
  'charge.waive', 'report.view'
]) as permission
where r.slug = 'finance';

-- No user_role rows: there are no staff accounts yet. Supabase Auth users and
-- their role grants arrive with the auth slice.

-- ── Everything else the property is configured with (capability F3) ───────
--
-- Day-pass age bands and family bundles, the facilities and whether each is in
-- the day pass, the bank accounts, and the document retention periods. Defined
-- once in seed_property_settings() (20260912000100) so this seed and the
-- migration that fills an existing database cannot disagree about them.

select seed_property_settings(id) from property;

-- ── The FAQs the public site starts with (capabilities A10 and F9) ─────────
--
-- Defined once in seed_faqs() (20260928000100) for the same reason: the
-- migration fills a database that already has a property, and this fills one
-- reset from nothing. Staff edit them from Admin → Website FAQs.

select seed_faqs(id) from property;

-- ── The extras a booking can add (capability F13) ──────────────────────────
--
-- The sofa bed, and nothing else. Defined once in seed_booking_extras()
-- (20261003000100) for the reason seed_faqs() is: that migration built the row
-- for a database that already had a property, and this builds it for one reset
-- from nothing. Staff add the rest from Admin → Property settings → Extras.

select seed_booking_extras(id) from property;
