-- ═══════════════════════════════════════════════════════════════════════════
-- Where Palm Villa is (Jeff, 19 September 2026).
--
-- The seeded answer to "Where are you?" said Bandar Seri Begawan. The building
-- is in Kampong Mumong, Kuala Belait, about 80 km away, and the map pin the
-- site already linked was there all along; only the words were wrong.
--
-- An FAQ is staff's to edit (Admin → Website FAQs), so this corrects the row
-- only where it still reads exactly as seeded. An answer somebody has already
-- rewritten is theirs, and is left alone.
--
-- A database reset from nothing never reaches this row: the FAQs are seeded
-- by seed.sql *after* every migration has run. That path is corrected at its
-- source instead, in seed_faqs()'s own row in 20260928000100 — a function
-- body only a property with no FAQs at all ever runs, so changing its text
-- rewrites nothing that exists.
--
-- Not scoped to one property_id, deliberately: the address is Palm Villa's,
-- and so is every property this schema holds — lib/domain/contact.ts, which
-- the site reads it from, carries no property either. Matching the seeded
-- text exactly is what keeps the update to rows nobody has touched.
-- ═══════════════════════════════════════════════════════════════════════════

update faq
set answer = E'Lot 9163, Spg 84-92-52-33, Jln Setia Diraja, Kpg Mumong A, Mukim Kuala Belait, KA1531.\nThe map is under "Getting here" on our home page.'
where slug = 'where-are-you'
  and answer = 'Bandar Seri Begawan, Brunei Darussalam.';
