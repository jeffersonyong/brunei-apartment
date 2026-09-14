-- The guard hands over the keys, so the guard checks guests in and out
-- (capabilities D3, D5; open question N54, answered).
--
-- 20260926000100 took `booking.check_in` away from Security, on the reading
-- that a guest collects the keys at the counter. Jason answered N54 on
-- 14 September 2026: the security guard and the front desk are the same
-- people, and it is the guard who hands the keys over. Checking in is the move
-- that says the guest has the unit, so it is the guard's again. So is checking
-- out: the guest gives the keys back to the guard, who checks the stay out
-- from the gate.
--
--   booking.check_in    Security, Front Office, Admin                (Security's grant restored)
--   booking.check_out   Security, Housekeeping, Front Office, Admin  (Security's grant added)
--
-- `day_pass.admit` stays exactly as 20260926000100 made it, and so does a pass
-- closing when it is admitted. Housekeeping keeps check-out, for the guest who
-- leaves the keys in the unit.
--
-- Neither move handles money. check_in_booking() still refuses a booking whose
-- deposit is not held in full, and checking out moves the booking and nothing
-- else.
--
-- Jason's project already carries 20260926000100, and `db push` runs no seed,
-- so the grants are made here as well as in seed.sql. They are inserts that do
-- nothing on conflict, so this removes nobody's grant — though it would put
-- back one an administrator had taken away from Security in Roles & staff
-- before it ran.

insert into role_permission (property_id, role_id, permission)
select r.property_id, r.id, grant_spec.permission
from staff_role r
join (
  values
    ('security', 'booking.check_in'),
    ('security', 'booking.check_out')
) as grant_spec (slug, permission) on grant_spec.slug = r.slug
on conflict do nothing;
