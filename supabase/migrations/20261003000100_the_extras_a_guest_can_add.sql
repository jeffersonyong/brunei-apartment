-- ═══════════════════════════════════════════════════════════════════════════
-- The extras a guest can add (capability F13).
--
-- Jeff asked on 17 September 2026 for staff to manage the optional items a
-- booking can buy — add a karaoke set, retire a sofa bed, take one off the
-- booking form for a month, say how many there are — because the list changes
-- as the building buys and sells things, and every change was a developer
-- deploy. It is the argument F7 won for the photographs and F9 for the FAQs,
-- now made for the one part of the price a customer chooses.
--
-- ── What was there before ─────────────────────────────────────────────────
--
-- One extra, the sofa bed, hard-coded in five places: `line_type` here, the
-- `BookingLineType` union in lib/domain/lines.ts, a branch in priceStay(), two
-- columns on `property`, and a counter on each of the three booking forms.
--
-- It is **migrated, not duplicated** (Jeff, 17 September 2026). The seeded row
-- below takes its fee and its stock from those columns, existing sofa-bed
-- lines are pointed at it so live bookings keep holding their beds, and the
-- columns are dropped. Two systems for one idea was the alternative, and the
-- concurrency rule in part 5 would then have had to be written twice.
--
-- ── The rule that did not exist ───────────────────────────────────────────
--
-- `property.sofa_bed_stock` was checked in exactly one place: priceStay(),
-- against a single booking's own quantity. Two bookings could each take two of
-- two sofa beds on the same night and nothing objected. **Stock was a form
-- limit, never an availability rule.** Part 5 makes it one.
--
-- ── Charging ──────────────────────────────────────────────────────────────
--
-- Flat per stay, quantity × fee, nights ignored (Jeff, 17 September 2026) —
-- which is how the sofa bed's BND 28 already worked. A per-night basis is one
-- column and one multiplier away if the business ever needs it; nothing here
-- forecloses it, and nothing here builds it.
--
-- Short stays only. Day passes keep their own bundle pricing untouched.
--
-- Eight parts, in dependency order.
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. The table.
-- ═══════════════════════════════════════════════════════════════════════════

create table booking_extra (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references property (id) on delete cascade,

  -- Stable across a rename, for the reason faq.slug is: things outside this
  -- table name an extra by it. Today that is the FAQ figure `{sofa bed
  -- charge}`, which resolves through slug `sofa-bed`; renaming the row to
  -- "Sofa bed (double)" must not silently empty an answer on the public site.
  -- Derived once by slugFromName() in lib/domain/extras.ts.
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),

  -- Mirrors MAX_EXTRA_NAME_LENGTH. Short, because it is a line on a receipt
  -- and a label on a counter, not a sentence.
  name text not null check (btrim(name) <> '' and char_length(name) <= 60),

  -- The line under the counter on the booking form — "Includes one pillow and
  -- one blanket". Optional: most extras are their own explanation.
  description text check (
    description is null or (btrim(description) <> '' and char_length(description) <= 200)
  ),

  -- Integer cents, BND, like every other figure. Flat, per stay.
  fee_cents integer not null check (fee_cents >= 0),

  -- How many the property owns. **Null means "nobody has counted them, do not
  -- constrain"** — the meaning property.sofa_bed_stock carried, kept because
  -- open-questions.md N8 is still open and a zero would refuse every booking.
  -- A number here starts enforcing part 5.
  stock integer check (stock is null or stock >= 0),

  -- Whether the booking forms offer it. Separate from `retired_at` because
  -- they answer different questions: "not this month" and "we do not own these
  -- any more". Both hide it from a customer; only retirement hides it from
  -- staff, and neither stops a booking that already holds one.
  bookable boolean not null default true,

  -- The order the booking form lists them in. Relative: gaps mean nothing.
  sort_order integer not null,

  -- Removal, which is never a delete. A booking_line points here, and the
  -- availability rule in part 5 must keep counting an extra that a live
  -- booking still holds — a hard delete would either orphan a receipt or
  -- silently free a sofa bed that is in somebody's room tonight.
  retired_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Null for the seeded sofa bed, which nobody added. Set null rather than
  -- blocking when the account goes, like faq.updated_by: the audit trail keeps
  -- who did what, and a price list is not a record anybody's history rests on.
  updated_by uuid references auth.users (id) on delete set null,

  unique (property_id, id),
  unique (property_id, slug),

  -- Deferred, so move_booking_extra() can swap two neighbours in one statement.
  constraint booking_extra_one_place unique (property_id, sort_order)
    deferrable initially deferred
);

-- Enabled with no policies, like every table since 20260829000800. The rows
-- are public in substance — a customer sees the bookable ones priced on the
-- booking form — but they are read through lib/db like everything else.
alter table booking_extra enable row level security;

comment on table booking_extra is
  'The optional items a short stay can buy (capability F13). Flat fee per stay. `stock` null means uncounted; a number is enforced across overlapping bookings by booking_line_extra_within_stock.';

comment on column booking_extra.retired_at is
  'Removal. Never a delete: booking_line points here, and an extra a live booking holds must keep counting against stock.';

create trigger booking_extra_touch_updated_at
  before update on booking_extra
  for each row
  execute function touch_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. The line that names one.
--
-- `extra_id` rather than a widening `line_type` enum, because the whole point
-- is that the set is no longer fixed. The line keeps its own `description`, so
-- a receipt still reads as it was priced even after the extra is renamed — the
-- pointer is for counting stock, not for rendering.
-- ═══════════════════════════════════════════════════════════════════════════

alter table booking_line
  add column extra_id uuid,
  add constraint booking_line_extra_fk
    foreign key (property_id, extra_id) references booking_extra (property_id, id);

create index booking_line_extra_idx
  on booking_line (property_id, extra_id)
  where extra_id is not null;

comment on column booking_line.extra_id is
  'Which configured extra this line bought (capability F13). Null on every other line type. The description is still the receipt; this is what part 5 counts.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. The sofa bed becomes a row.
--
-- Three steps in one transaction, which is why they are here rather than in a
-- seed: the row is built from the columns, the existing lines are pointed at
-- it, and only then do the columns go. Nothing between those steps is a state
-- the application ever sees.
-- ═══════════════════════════════════════════════════════════════════════════

insert into booking_extra (property_id, slug, name, description, fee_cents, stock, sort_order)
select
  p.id,
  'sofa-bed',
  'Sofa bed',
  'Includes one pillow and one blanket.',
  p.sofa_bed_fee_cents,
  p.sofa_bed_stock,
  1
from property p;

-- Every sofa bed any booking has ever bought, pointed at the row that now
-- represents it — so a stay running tonight still holds its bed when part 5
-- starts counting, and a stock figure entered tomorrow is true immediately.
update booking_line bl
set extra_id = e.id, line_type = 'extra'
from booking_extra e
where e.property_id = bl.property_id
  and e.slug = 'sofa-bed'
  and bl.line_type = 'sofa_bed';

-- `sofa_bed` leaves the vocabulary: the update above proves no row carries it,
-- and leaving a dead value in the list is an invitation to write one.
alter table booking_line drop constraint booking_line_line_type_check;

alter table booking_line add constraint booking_line_line_type_check check (
  line_type in (
    'accommodation', 'extra_person', 'extra', 'early_check_in',
    'late_check_out', 'day_pass', 'day_pass_bundle', 'discount'
  )
);

-- The two halves of "this line bought an extra" cannot come apart. An `extra`
-- line with no pointer could not be counted; a pointer on an accommodation
-- line would be counted twice.
alter table booking_line add constraint booking_line_extra_id_matches_type check (
  (line_type = 'extra') = (extra_id is not null)
);

alter table property
  drop column sofa_bed_fee_cents,
  drop column sofa_bed_stock;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. property_settings() and save_pricing_settings(), without those columns.
--
-- Replaced rather than edited for the obvious reason — the columns they name
-- no longer exist. `property_settings` gains the extras list, so the settings
-- screen and getPropertyConfig() read them the same way they read unit types,
-- and a quote and the Extras tab cannot come apart.
--
-- The extras are NOT part of save_pricing_settings(). They are rows edited one
-- at a time from their own screen, like FAQs and photographs, not fields in
-- the one atomic policy save — and a stock figure is checked against live
-- bookings, which a whole-form save has no place doing.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function property_settings(p_property_id uuid)
returns jsonb
language sql
stable
as $function$
  select jsonb_build_object(
    'property_id', p.id,
    'name', p.name,
    'time_zone', p.time_zone,
    'currency', p.currency,
    'settings_updated_at', p.settings_updated_at,
    'policy', jsonb_build_object(
      'pax_policy', p.pax_policy,
      'extra_person_per_night_cents', p.extra_person_per_night_cents,
      'pax_exempt_age_max', p.pax_exempt_age_max,
      'early_check_in_per_hour_cents', p.early_check_in_per_hour_cents,
      'late_check_out_per_hour_cents', p.late_check_out_per_hour_cents,
      'check_in_time', p.check_in_time,
      'check_out_time', p.check_out_time,
      'security_deposit_cents', p.security_deposit_cents,
      'max_advance_booking_days', p.max_advance_booking_days
    ),
    -- Retired ones included. The settings screen shows them under their own
    -- heading so they can be restored, and configFromSettings() filters to the
    -- bookable ones — the filter belongs where the audience is known.
    'extras', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id,
        'slug', e.slug,
        'name', e.name,
        'description', e.description,
        'fee_cents', e.fee_cents,
        'stock', e.stock,
        'bookable', e.bookable,
        'sort_order', e.sort_order,
        'retired_at', e.retired_at,
        'updated_at', e.updated_at
      ) order by e.sort_order, e.name)
      from booking_extra e where e.property_id = p.id
    ), '[]'::jsonb),
    'unit_types', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ut.id,
        'slug', ut.slug,
        'name', ut.name,
        'base_rate_cents', ut.base_rate_cents,
        'max_pax', ut.max_pax,
        'car_parks', ut.car_parks
      ) order by ut.base_rate_cents, ut.slug)
      from unit_type ut where ut.property_id = p.id
    ), '[]'::jsonb),
    'bands', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', b.id,
        'label', b.label,
        'min_age', b.min_age,
        'max_age_exclusive', b.max_age_exclusive,
        'price_cents', b.price_cents
      ) order by b.min_age)
      from day_pass_age_band b where b.property_id = p.id
    ), '[]'::jsonb),
    'bundles', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id,
        'label', d.label,
        'price_cents', d.price_cents,
        'sort_order', d.sort_order,
        'lines', coalesce((
          select jsonb_agg(jsonb_build_object('band_id', l.band_id, 'headcount', l.headcount)
            order by l.band_id)
          from day_pass_bundle_line l where l.bundle_id = d.id
        ), '[]'::jsonb)
      ) order by d.sort_order, d.label)
      from day_pass_bundle d where d.property_id = p.id
    ), '[]'::jsonb),
    'facilities', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id,
        'slug', f.slug,
        'name', f.name,
        'included_in_day_pass', f.included_in_day_pass,
        'day_pass_capacity', f.day_pass_capacity,
        'sort_order', f.sort_order
      ) order by f.sort_order, f.name)
      from facility f where f.property_id = p.id
    ), '[]'::jsonb),
    'retention', coalesce((
      select jsonb_agg(jsonb_build_object('kind', r.kind, 'months', r.months) order by r.kind)
      from document_retention r where r.property_id = p.id
    ), '[]'::jsonb),
    'bank_accounts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'bank_name', a.bank_name,
        'account_number', a.account_number,
        'sort_order', a.sort_order
      ) order by a.sort_order, a.bank_name)
      from bank_account a where a.property_id = p.id
    ), '[]'::jsonb)
  )
  from property p
  where p.id = p_property_id
$function$;

create or replace function save_pricing_settings(
  p_property_id uuid,
  p_expected_updated_at timestamptz,
  p_unit_types jsonb,
  p_policy jsonb,
  p_actor_id uuid default null
)
returns jsonb
language plpgsql
as $function$
declare
  entry jsonb;
  v_current timestamptz;
  v_changed integer := 0;
  v_id uuid;
  v_before jsonb;
  v_after jsonb;
begin
  v_current := settings_token(p_property_id, p_expected_updated_at);

  for entry in select * from jsonb_array_elements(coalesce(p_unit_types, '[]'::jsonb)) loop
    select ut.id, jsonb_build_object(
      'name', ut.name,
      'base_rate_cents', ut.base_rate_cents,
      'max_pax', ut.max_pax,
      'car_parks', ut.car_parks
    )
    into v_id, v_before
    from unit_type ut
    where ut.property_id = p_property_id and ut.slug = entry ->> 'slug';

    if not found then
      raise exception 'unit_type_not_found:%', entry ->> 'slug' using errcode = 'PV001';
    end if;

    v_after := jsonb_build_object(
      'name', v_before ->> 'name',
      'base_rate_cents', (entry ->> 'base_rate_cents')::integer,
      'max_pax', (entry ->> 'max_pax')::integer,
      'car_parks', (entry ->> 'car_parks')::integer
    );

    update unit_type set
      base_rate_cents = (v_after ->> 'base_rate_cents')::integer,
      max_pax = (v_after ->> 'max_pax')::integer,
      car_parks = (v_after ->> 'car_parks')::integer
    where id = v_id;

    if audit_settings_change(
      p_property_id, p_actor_id, 'unit_type.updated', 'unit_type', v_id, v_before, v_after
    ) then
      v_changed := v_changed + 1;
    end if;
  end loop;

  select jsonb_build_object(
    'pax_policy', p.pax_policy,
    'extra_person_per_night_cents', p.extra_person_per_night_cents,
    'pax_exempt_age_max', p.pax_exempt_age_max,
    'early_check_in_per_hour_cents', p.early_check_in_per_hour_cents,
    'late_check_out_per_hour_cents', p.late_check_out_per_hour_cents,
    'check_in_time', p.check_in_time,
    'check_out_time', p.check_out_time,
    'security_deposit_cents', p.security_deposit_cents,
    'max_advance_booking_days', p.max_advance_booking_days
  )
  into v_before
  from property p
  where p.id = p_property_id;

  v_after := jsonb_build_object(
    'pax_policy', p_policy ->> 'pax_policy',
    'extra_person_per_night_cents', (p_policy ->> 'extra_person_per_night_cents')::integer,
    'pax_exempt_age_max', (p_policy ->> 'pax_exempt_age_max')::integer,
    'early_check_in_per_hour_cents', (p_policy ->> 'early_check_in_per_hour_cents')::integer,
    'late_check_out_per_hour_cents', (p_policy ->> 'late_check_out_per_hour_cents')::integer,
    'check_in_time', p_policy ->> 'check_in_time',
    'check_out_time', p_policy ->> 'check_out_time',
    'security_deposit_cents', (p_policy ->> 'security_deposit_cents')::integer,
    'max_advance_booking_days', (p_policy ->> 'max_advance_booking_days')::integer
  );

  update property set
    pax_policy = v_after ->> 'pax_policy',
    extra_person_per_night_cents = (v_after ->> 'extra_person_per_night_cents')::integer,
    pax_exempt_age_max = (v_after ->> 'pax_exempt_age_max')::integer,
    early_check_in_per_hour_cents = (v_after ->> 'early_check_in_per_hour_cents')::integer,
    late_check_out_per_hour_cents = (v_after ->> 'late_check_out_per_hour_cents')::integer,
    check_in_time = v_after ->> 'check_in_time',
    check_out_time = v_after ->> 'check_out_time',
    security_deposit_cents = (v_after ->> 'security_deposit_cents')::integer,
    max_advance_booking_days = (v_after ->> 'max_advance_booking_days')::integer
  where id = p_property_id;

  if audit_settings_change(
    p_property_id, p_actor_id, 'property.policy_updated', 'property', p_property_id,
    v_before, v_after
  ) then
    v_changed := v_changed + 1;
  end if;

  return jsonb_build_object(
    'ok', true,
    'changed', v_changed,
    'settings_updated_at', settings_touched(p_property_id, v_changed, v_current)
  );

exception
  when sqlstate 'PV001' then
    return jsonb_build_object(
      'ok', false,
      'error', split_part(sqlerrm, ':', 1),
      'detail', split_part(sqlerrm, ':', 2)
    );
end;
$function$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. THE AVAILABILITY RULE — an extra cannot be in two rooms at once.
--
-- ── Why this is not an exclusion constraint ───────────────────────────────
--
-- architecture.md §5.2 and scope-of-capabilities.md G1 make one promise about
-- availability: it is enforced by the database, not by application logic that
-- loses the race. A GiST exclusion constraint delivers that for a unit because
-- "occupied" is a **pairwise** fact — two ranges on one unit overlap, or they
-- do not, and two rows are enough to see it.
--
-- Three sofa beds is not pairwise. Two bookings each taking two of three beds
-- are individually fine and jointly impossible, and no constraint that reads
-- two rows at a time can say so. The rule is a SUM over every overlapping
-- booking, per night, and the mechanism that enforces a sum in Postgres is a
-- trigger holding a lock — which is what this is. **It is still the database,
-- and still not application logic**: every writer is covered, including ones
-- not written yet, and a server action that forgot to check is caught anyway.
-- architecture.md records the divergence and this reasoning.
--
-- ── Serialisation ─────────────────────────────────────────────────────────
--
-- The advisory lock is what makes the count true. Without it two transactions
-- both read "two in use, one free", both pass, and both commit. With it the
-- second waits; under READ COMMITTED its next statement takes a fresh snapshot
-- and sees the first booking's line. One lock per property, not per extra: a
-- booking buying two extras would otherwise need them in a fixed order to
-- avoid a deadlock, and bookings are made a few times an hour.
--
-- ── Deferred ──────────────────────────────────────────────────────────────
--
-- To the end of the transaction, because the trigger reads the booking's
-- occupancy and the writers do not agree on the order. create_walk_in_booking()
-- inserts occupancy before its lines; amend_booking() rewrites the lines and
-- moves the occupancy. Deferring means the rule reads the transaction as it
-- will be committed rather than as it is half-built.
--
-- ── What counts as "in use" ───────────────────────────────────────────────
--
-- Exactly what counts for the unit: the three statuses the exclusion
-- constraint releases on — `expired`, `cancelled` and, since 20260922000100,
-- `no_show` — and no others. One booking therefore never holds a room but not
-- the sofa bed in it, and "freed when they check out" means what it already
-- means for the room. A guest who leaves on the 12th of a stay booked to the
-- 14th keeps both until the booking is amended: the same answer the unit
-- gives, and giving two different answers would be the surprise.
--
-- If that list ever moves, it moves in both places or the two facts about one
-- booking disagree.
-- ═══════════════════════════════════════════════════════════════════════════

-- How many of each extra are held on the busiest night of a range, ignoring
-- one booking (its own, when amending). The read side of the rule: the booking
-- forms call it to show "2 of 3 left", and the trigger calls it to enforce.
-- Returns only extras somebody is holding; callers read a missing row as zero.
create function extras_in_use(
  p_property_id uuid,
  p_check_in date,
  p_check_out date,
  p_exclude_booking_id uuid default null
)
returns table (extra_id uuid, peak integer)
language sql
stable
as $function$
  with nights as (
    select generated::date as night
    from generate_series(p_check_in, p_check_out - 1, interval '1 day') as generated
  ),
  held as (
    select bl.extra_id as held_extra_id, n.night, sum(bl.quantity) as quantity
    from nights n
    join occupancy o
      on o.property_id = p_property_id
     and o.status not in ('expired', 'cancelled', 'no_show')
     and o.start_date <= n.night
     and o.end_date > n.night
     and (p_exclude_booking_id is null or o.booking_id <> p_exclude_booking_id)
    join booking_line bl
      on bl.property_id = p_property_id
     and bl.booking_id = o.booking_id
     and bl.extra_id is not null
    group by bl.extra_id, n.night
  )
  select held_extra_id, max(quantity)::integer
  from held
  group by held_extra_id
$function$;

comment on function extras_in_use(uuid, date, date, uuid) is
  'Peak quantity of each extra held by overlapping occupancies across a range (capability F13). The read side of booking_line_extra_within_stock; the forms use it for "N left".';

-- Every extra held over a window, one row per line, with the occupancy range
-- it rides on. The public booking form loads a whole advance window of these
-- once and computes its own "N free" per range in the browser, the way it
-- already does for units — `nightlyExtraUse` in lib/domain/availability
-- -calendar.ts is the other half.
--
-- A function rather than a PostgREST join because `booking_line` and
-- `occupancy` have no relationship to each other: both point at `booking`, and
-- asking PostgREST to walk that is two embedded levels to save one function.
create function extras_held_in_window(
  p_property_id uuid,
  p_from date,
  p_to date
)
returns table (
  extra_id uuid,
  quantity integer,
  start_date date,
  end_date date,
  status text
)
language sql
stable
as $function$
  select bl.extra_id, bl.quantity, o.start_date, o.end_date, o.status
  from booking_line bl
  join occupancy o
    on o.property_id = bl.property_id
   and o.booking_id = bl.booking_id
  where bl.property_id = p_property_id
    and bl.extra_id is not null
    and o.status not in ('expired', 'cancelled', 'no_show')
    and o.start_date < p_to
    and (o.end_date is null or o.end_date > p_from)
$function$;

comment on function extras_held_in_window(uuid, date, date) is
  'Extras held over a window, for the booking form''s in-browser preview (capability F13). extras_in_use is the authoritative peak; this is the raw rows.';

create function assert_extra_within_stock() returns trigger
language plpgsql
as $function$
declare
  v_extra booking_extra%rowtype;
  v_range record;
  v_in_use integer;
begin
  select * into v_extra
  from booking_extra e
  where e.id = new.extra_id and e.property_id = new.property_id;

  -- Nobody has counted them, so nothing can be oversold (N8). The fee still
  -- prices; only the limit is absent.
  if v_extra.stock is null then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext(new.property_id::text || ':booking_extra'));

  select o.start_date, o.end_date into v_range
  from occupancy o
  where o.property_id = new.property_id
    and o.booking_id = new.booking_id
    and o.status not in ('expired', 'cancelled', 'no_show');

  -- No occupancy holds the range any more — the booking was cancelled or
  -- expired inside this same transaction. It holds nothing, so it oversells
  -- nothing.
  if not found then
    return new;
  end if;

  -- Its own line is excluded from the count and added back as `new.quantity`,
  -- so an amendment is measured against what it is becoming rather than
  -- against what it was plus what it will be.
  select coalesce(u.peak, 0) into v_in_use
  from extras_in_use(new.property_id, v_range.start_date, v_range.end_date, new.booking_id) u
  where u.extra_id = new.extra_id;

  if coalesce(v_in_use, 0) + new.quantity > v_extra.stock then
    raise exception 'extra_unavailable:%:%', v_extra.name,
      greatest(v_extra.stock - coalesce(v_in_use, 0), 0)
      using errcode = 'PV002';
  end if;

  return new;
end;
$function$;

create constraint trigger booking_line_extra_within_stock
  after insert or update on booking_line
  deferrable initially deferred
  for each row
  when (new.extra_id is not null)
  execute function assert_extra_within_stock();

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. The writers.
--
-- The shape every writer in this schema has: lock, validate everything, then
-- write, returning a refusal as a VALUE rather than raising. One advisory lock
-- per property's extras — the same one the trigger takes, deliberately, so a
-- stock figure cannot be lowered underneath a booking that is being priced
-- against the old one.
-- ═══════════════════════════════════════════════════════════════════════════

create function booking_extra_tidy(p_text text)
returns text
language sql
immutable
as $function$
  select btrim(regexp_replace(coalesce(p_text, ''), '\s+', ' ', 'g'))
$function$;

create function add_booking_extra(
  p_property_id uuid,
  p_slug text,
  p_name text,
  p_description text,
  p_fee_cents integer,
  p_stock integer,
  p_bookable boolean,
  p_actor_id uuid
)
returns jsonb
language plpgsql
as $function$
declare
  v_name text := booking_extra_tidy(p_name);
  v_description text := nullif(booking_extra_tidy(p_description), '');
  v_bookable boolean := coalesce(p_bookable, true);
  v_slug text;
  v_suffix integer := 1;
  v_sort integer;
  v_id uuid;
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'error', 'actor_required');
  end if;

  if v_name = '' or char_length(v_name) > 60 then
    return jsonb_build_object('ok', false, 'error', 'name_invalid');
  end if;

  if v_description is not null and char_length(v_description) > 200 then
    return jsonb_build_object('ok', false, 'error', 'description_invalid');
  end if;

  if p_fee_cents is null or p_fee_cents < 0 then
    return jsonb_build_object('ok', false, 'error', 'fee_invalid');
  end if;

  if p_stock is not null and p_stock < 0 then
    return jsonb_build_object('ok', false, 'error', 'stock_invalid');
  end if;

  if p_slug is null or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(p_slug) > 80 then
    return jsonb_build_object('ok', false, 'error', 'slug_invalid');
  end if;

  perform pg_advisory_xact_lock(hashtext(p_property_id::text || ':booking_extra'));

  -- A second "Karaoke set" is a new address, not a clash: `-2`, `-3`, with the
  -- base shortened first so the result still fits the check. add_faq()'s rule.
  v_slug := p_slug;

  while exists (
    select 1 from booking_extra e where e.property_id = p_property_id and e.slug = v_slug
  ) loop
    v_suffix := v_suffix + 1;
    v_slug := rtrim(left(p_slug, 80 - char_length(v_suffix::text) - 1), '-') || '-' || v_suffix;
  end loop;

  select coalesce(max(e.sort_order), 0) + 1 into v_sort
  from booking_extra e
  where e.property_id = p_property_id;

  insert into booking_extra (
    property_id, slug, name, description, fee_cents, stock, bookable, sort_order, updated_by
  )
  values (
    p_property_id, v_slug, v_name, v_description, p_fee_cents, p_stock,
    v_bookable, v_sort, p_actor_id
  )
  returning id into v_id;

  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id, p_actor_id, 'booking_extra.added', 'booking_extra', v_id,
    null,
    jsonb_build_object(
      'name', v_name, 'fee_cents', p_fee_cents, 'stock', p_stock, 'bookable', v_bookable
    )
  );

  return jsonb_build_object('ok', true, 'id', v_id, 'slug', v_slug);
end;
$function$;

-- A rename, a reprice, a recount, or the booking-form toggle.
--
-- `p_expected_updated_at` is the extra as the editor opened it; if it has moved
-- somebody else saved in the meantime and this would undo their work, so it is
-- refused as `stale`. The slug never moves — see the column comment.
--
-- **Lowering stock below what is already sold is refused**, not applied. The
-- alternative is a figure that says three while four are in rooms tonight, and
-- every later booking priced against a lie. The refusal names the night.
create function update_booking_extra(
  p_property_id uuid,
  p_extra_id uuid,
  p_name text,
  p_description text,
  p_fee_cents integer,
  p_stock integer,
  p_bookable boolean,
  p_expected_updated_at timestamptz,
  p_actor_id uuid
)
returns jsonb
language plpgsql
as $function$
declare
  v_extra booking_extra%rowtype;
  v_name text := booking_extra_tidy(p_name);
  v_description text := nullif(booking_extra_tidy(p_description), '');
  v_bookable boolean := coalesce(p_bookable, true);
  v_committed integer;
  v_before jsonb;
  v_after jsonb;
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'error', 'actor_required');
  end if;

  if v_name = '' or char_length(v_name) > 60 then
    return jsonb_build_object('ok', false, 'error', 'name_invalid');
  end if;

  if v_description is not null and char_length(v_description) > 200 then
    return jsonb_build_object('ok', false, 'error', 'description_invalid');
  end if;

  if p_fee_cents is null or p_fee_cents < 0 then
    return jsonb_build_object('ok', false, 'error', 'fee_invalid');
  end if;

  if p_stock is not null and p_stock < 0 then
    return jsonb_build_object('ok', false, 'error', 'stock_invalid');
  end if;

  perform pg_advisory_xact_lock(hashtext(p_property_id::text || ':booking_extra'));

  select * into v_extra
  from booking_extra e
  where e.id = p_extra_id and e.property_id = p_property_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_extra.updated_at is distinct from p_expected_updated_at then
    return jsonb_build_object('ok', false, 'error', 'stale');
  end if;

  if p_stock is not null then
    -- The busiest night any live booking holds, from today forward. Past
    -- nights are not a constraint on a number that describes today's shelf.
    select max(u.peak) into v_committed
    from occupancy o
    cross join lateral extras_in_use(
      p_property_id, greatest(o.start_date, current_date), o.end_date, null
    ) u
    where o.property_id = p_property_id
      and o.status not in ('expired', 'cancelled', 'no_show')
      and o.end_date > current_date
      and u.extra_id = p_extra_id;

    if coalesce(v_committed, 0) > p_stock then
      return jsonb_build_object(
        'ok', false, 'error', 'stock_below_committed', 'committed', v_committed
      );
    end if;
  end if;

  v_before := jsonb_build_object(
    'name', v_extra.name,
    'description', v_extra.description,
    'fee_cents', v_extra.fee_cents,
    'stock', v_extra.stock,
    'bookable', v_extra.bookable
  );

  v_after := jsonb_build_object(
    'name', v_name,
    'description', v_description,
    'fee_cents', p_fee_cents,
    'stock', p_stock,
    'bookable', v_bookable
  );

  update booking_extra set
    name = v_name,
    description = v_description,
    fee_cents = p_fee_cents,
    stock = p_stock,
    bookable = v_bookable,
    updated_by = p_actor_id
  where id = p_extra_id;

  -- The name rides on both sides so the audit screen can say which extra it
  -- was without joining to a row that may since have been renamed again.
  perform audit_settings_change(
    p_property_id, p_actor_id, 'booking_extra.updated', 'booking_extra', p_extra_id,
    v_before || jsonb_build_object('name', v_extra.name),
    v_after || jsonb_build_object('name', v_name)
  );

  return jsonb_build_object('ok', true);
end;
$function$;

-- Up or down one place in the booking form's list. Two rows swap under the
-- deferred unique constraint, which is what lets them trade numbers in one
-- statement. Retired extras are not in the order and cannot be moved.
create function move_booking_extra(
  p_property_id uuid,
  p_extra_id uuid,
  p_direction text,
  p_actor_id uuid
)
returns jsonb
language plpgsql
as $function$
declare
  v_extra booking_extra%rowtype;
  v_neighbour booking_extra%rowtype;
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'error', 'actor_required');
  end if;

  if p_direction not in ('up', 'down') then
    return jsonb_build_object('ok', false, 'error', 'direction_invalid');
  end if;

  perform pg_advisory_xact_lock(hashtext(p_property_id::text || ':booking_extra'));

  select * into v_extra
  from booking_extra e
  where e.id = p_extra_id and e.property_id = p_property_id and e.retired_at is null
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if p_direction = 'up' then
    select * into v_neighbour
    from booking_extra e
    where e.property_id = p_property_id
      and e.retired_at is null
      and e.sort_order < v_extra.sort_order
    order by e.sort_order desc
    limit 1
    for update;
  else
    select * into v_neighbour
    from booking_extra e
    where e.property_id = p_property_id
      and e.retired_at is null
      and e.sort_order > v_extra.sort_order
    order by e.sort_order asc
    limit 1
    for update;
  end if;

  -- Already at the end. Not a refusal: the button is disabled there, and a
  -- double-click that lands anyway should be a no-op rather than an error.
  if not found then
    return jsonb_build_object('ok', true, 'moved', false);
  end if;

  update booking_extra set sort_order = v_neighbour.sort_order where id = v_extra.id;
  update booking_extra set sort_order = v_extra.sort_order where id = v_neighbour.id;

  return jsonb_build_object('ok', true, 'moved', true);
end;
$function$;

-- Removal. Sets `retired_at` and nothing else, for the reason the column
-- comment gives. Bookings that already hold one keep it, on the receipt and in
-- the count; it simply cannot be sold again.
create function retire_booking_extra(
  p_property_id uuid,
  p_extra_id uuid,
  p_actor_id uuid
)
returns jsonb
language plpgsql
as $function$
declare
  v_extra booking_extra%rowtype;
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'error', 'actor_required');
  end if;

  perform pg_advisory_xact_lock(hashtext(p_property_id::text || ':booking_extra'));

  select * into v_extra
  from booking_extra e
  where e.id = p_extra_id and e.property_id = p_property_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_extra.retired_at is not null then
    return jsonb_build_object('ok', true, 'already', true);
  end if;

  update booking_extra
  set retired_at = now(), bookable = false, updated_by = p_actor_id
  where id = p_extra_id;

  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id, p_actor_id, 'booking_extra.removed', 'booking_extra', p_extra_id,
    jsonb_build_object('name', v_extra.name, 'fee_cents', v_extra.fee_cents),
    null
  );

  return jsonb_build_object('ok', true);
end;
$function$;

-- Put back, at the end of the list. Not bookable until somebody says so: the
-- price and the count may both be stale by the time an extra comes back, and
-- restoring straight onto the public booking form would sell at whatever it
-- cost the day it was removed.
create function restore_booking_extra(
  p_property_id uuid,
  p_extra_id uuid,
  p_actor_id uuid
)
returns jsonb
language plpgsql
as $function$
declare
  v_extra booking_extra%rowtype;
  v_sort integer;
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'error', 'actor_required');
  end if;

  perform pg_advisory_xact_lock(hashtext(p_property_id::text || ':booking_extra'));

  select * into v_extra
  from booking_extra e
  where e.id = p_extra_id and e.property_id = p_property_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_extra.retired_at is null then
    return jsonb_build_object('ok', true, 'already', true);
  end if;

  select coalesce(max(e.sort_order), 0) + 1 into v_sort
  from booking_extra e
  where e.property_id = p_property_id;

  update booking_extra
  set retired_at = null, bookable = false, sort_order = v_sort, updated_by = p_actor_id
  where id = p_extra_id;

  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id, p_actor_id, 'booking_extra.restored', 'booking_extra', p_extra_id,
    null,
    jsonb_build_object('name', v_extra.name, 'bookable', false)
  );

  return jsonb_build_object('ok', true);
end;
$function$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. seed_booking_extras() — what a new property starts with.
--
-- The sofa bed, at the figures prd.md §8.2 states, with no stock: N8 has never
-- been answered and a guessed number would refuse real bookings. Called by the
-- seed alongside the other seeders; the migration above has already built the
-- row for the property that exists.
-- ═══════════════════════════════════════════════════════════════════════════

create function seed_booking_extras(p_property_id uuid)
returns void
language sql
as $function$
  insert into booking_extra (
    property_id, slug, name, description, fee_cents, stock, bookable, sort_order
  )
  values (
    p_property_id, 'sofa-bed', 'Sofa bed', 'Includes one pillow and one blanket.',
    2800, null, true, 1
  )
  on conflict (property_id, slug) do nothing
$function$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. Grants. Nothing reaches these but the service role, like every function
-- since 20260829000800 — lib/db is the only caller and it holds the key.
-- ═══════════════════════════════════════════════════════════════════════════

revoke execute on function extras_in_use(uuid, date, date, uuid) from public, anon, authenticated;
revoke execute on function extras_held_in_window(uuid, date, date) from public, anon, authenticated;
revoke execute on function assert_extra_within_stock() from public, anon, authenticated;
revoke execute on function booking_extra_tidy(text) from public, anon, authenticated;
revoke execute on function add_booking_extra(uuid, text, text, text, integer, integer, boolean, uuid)
  from public, anon, authenticated;
revoke execute on function update_booking_extra(
  uuid, uuid, text, text, integer, integer, boolean, timestamptz, uuid
) from public, anon, authenticated;
revoke execute on function move_booking_extra(uuid, uuid, text, uuid)
  from public, anon, authenticated;
revoke execute on function retire_booking_extra(uuid, uuid, uuid)
  from public, anon, authenticated;
revoke execute on function restore_booking_extra(uuid, uuid, uuid)
  from public, anon, authenticated;
revoke execute on function seed_booking_extras(uuid) from public, anon, authenticated;

grant execute on function extras_in_use(uuid, date, date, uuid) to service_role;
grant execute on function extras_held_in_window(uuid, date, date) to service_role;
grant execute on function add_booking_extra(uuid, text, text, text, integer, integer, boolean, uuid)
  to service_role;
grant execute on function update_booking_extra(
  uuid, uuid, text, text, integer, integer, boolean, timestamptz, uuid
) to service_role;
grant execute on function move_booking_extra(uuid, uuid, text, uuid) to service_role;
grant execute on function retire_booking_extra(uuid, uuid, uuid) to service_role;
grant execute on function restore_booking_extra(uuid, uuid, uuid) to service_role;
grant execute on function seed_booking_extras(uuid) to service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. The three writers, now carrying `extra_id` onto the line.
--
-- Each of these takes its lines as jsonb and copies them into `booking_line`
-- column by column. `extraId` was on the objects the engine built all along —
-- it was this SELECT that dropped it, so every `extra` line arrived naming no
-- extra, the pairing constraint in part 3 refused it, and the rule in part 5
-- had nothing to count.
--
-- Re-emitted verbatim from their latest definitions, with that one statement
-- changed and nothing else:
--
--   • create_walk_in_booking() — 20261002000100_every_booking_takes_an_email.sql
--   • amend_booking() — 20260902000100_discounts_and_notes.sql
--   • create_public_stay_booking() — 20260913000100_public_bookings_and_day_passes.sql
--
-- `create_public_day_pass_booking()` is deliberately not among them: extras
-- are a short-stay idea, so a day pass never carries one and its own copy of
-- this statement has nothing to gain.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function create_walk_in_booking(
  p_property_id uuid,
  p_unit_id uuid,
  p_status text,
  p_check_in date,
  p_check_out date,
  p_guest_name text,
  p_guest_phone text,
  -- Required, like the name and the number beside it. Every booking carries an
  -- address now, so every guest gets their confirmation and their entry code
  -- without asking for them (capability A8, 17 September 2026).
  p_guest_email text,
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
  v_email text := nullif(btrim(coalesce(p_guest_email, '')), '');
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

  -- An address is how the confirmation and the entry code reach the guest, so
  -- a booking without one cannot be completed by anybody — the desk, the gate,
  -- or the website (prd.md §13). Raised rather than returned, like the vehicle
  -- check below and for the same reason.
  if v_email is null then
    raise exception 'a booking needs an email address for the guest';
  end if;

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
  insert into guest (property_id, name, phone, email)
  values (p_property_id, p_guest_name, p_guest_phone, v_email)
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

  -- `extra_id` joined this list on 17 September 2026 (capability F13).
  -- Without it an `extra` line arrives with nothing naming which extra it
  -- bought, `booking_line_extra_id_matches_type` refuses it, and the stock
  -- rule has nothing to count. The engine already puts it on the line; this
  -- is the statement that had been dropping it.
  insert into booking_line (
    property_id, booking_id, line_type, description,
    quantity, unit_price_cents, amount_cents, sort_order, extra_id
  )
  select
    p_property_id,
    v_booking_id,
    entry ->> 'type',
    entry ->> 'description',
    (entry ->> 'quantity')::integer,
    (entry ->> 'unitPrice')::integer,
    (entry ->> 'amount')::integer,
    (ordinality - 1)::integer,
    (entry ->> 'extraId')::uuid
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

create or replace function amend_booking(
  p_property_id uuid,
  p_booking_id uuid,
  p_expected_updated_at timestamptz,
  p_unit_id uuid,
  p_check_in date,
  p_check_out date,
  p_guest_name text,
  p_guest_phone text,
  p_vehicles text[],
  p_no_vehicle boolean,
  p_chargeable_guests integer,
  p_exempt_guests integer,
  p_total_cents integer,
  p_security_deposit_cents integer,
  p_lines jsonb,
  p_discount_kind text default null,
  p_discount_value integer default null,
  p_discount_reason text default null,
  p_reason text default null,
  p_actor_id uuid default null
)
returns jsonb
language plpgsql
as $function$
declare
  v_booking booking%rowtype;
  v_occupancy occupancy%rowtype;
  v_guest guest%rowtype;
  v_before jsonb;
  v_after jsonb;
  v_previous_vehicles jsonb;
  v_vehicles text[] := coalesce(p_vehicles, '{}'::text[]);
  v_discount_reason text := nullif(btrim(coalesce(p_discount_reason, '')), '');
  v_discount_changed boolean;
begin
  if cardinality(v_vehicles) = 0 and not p_no_vehicle then
    raise exception 'a booking needs at least one vehicle registration, or the no-vehicle exception';
  end if;

  if p_discount_kind is not null and (p_discount_value is null or v_discount_reason is null) then
    raise exception 'a discount needs a value and a reason';
  end if;

  select * into v_booking
  from booking
  where id = p_booking_id and property_id = p_property_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  -- Two staff members with the same booking open is the ordinary case, not the
  -- exotic one.
  if v_booking.updated_at is distinct from p_expected_updated_at then
    return jsonb_build_object('ok', false, 'error', 'changed');
  end if;

  select * into v_occupancy
  from occupancy
  where booking_id = p_booking_id and property_id = p_property_id
  for update;

  -- Day passes occupy no unit (prd.md §6.1) and have no row here. They now
  -- reach booking_summary, so this guard is the thing that stops the amend
  -- screen — which is a *stay* amendment — being pointed at one. The day-pass
  -- slice brings its own amendment path.
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  select * into v_guest from guest where id = v_booking.guest_id for update;

  select coalesce(jsonb_agg(bv.registration order by bv.sort_order), '[]'::jsonb)
  into v_previous_vehicles
  from booking_vehicle bv
  where bv.booking_id = p_booking_id and bv.property_id = p_property_id;

  v_discount_changed :=
    v_booking.discount_kind is distinct from p_discount_kind
    or v_booking.discount_value is distinct from p_discount_value
    or v_booking.discount_reason is distinct from v_discount_reason;

  v_before := jsonb_build_object(
    'unit_id', v_occupancy.unit_id,
    'check_in', v_occupancy.start_date,
    'check_out', v_occupancy.end_date,
    'guest_name', v_guest.name,
    'guest_phone', v_guest.phone,
    'vehicles', v_previous_vehicles,
    'no_vehicle', v_booking.no_vehicle,
    'chargeable_guests', v_booking.chargeable_guests,
    'exempt_guests', v_booking.exempt_guests,
    'total_cents', v_booking.total_cents,
    'security_deposit_cents', v_booking.security_deposit_cents,
    'discount_kind', v_booking.discount_kind,
    'discount_value', v_booking.discount_value,
    'discount_reason', v_booking.discount_reason
  );

  -- Editing the guest row in place is correct ONLY while every booking owns a
  -- guest row of its own, which create_walk_in_booking() guarantees today.
  update guest
  set name = p_guest_name, phone = p_guest_phone
  where id = v_booking.guest_id and property_id = p_property_id;

  update booking
  set chargeable_guests = p_chargeable_guests,
      exempt_guests = p_exempt_guests,
      no_vehicle = p_no_vehicle,
      total_cents = p_total_cents,
      security_deposit_cents = p_security_deposit_cents,
      discount_kind = p_discount_kind,
      discount_value = p_discount_value,
      discount_reason = v_discount_reason
  where id = p_booking_id and property_id = p_property_id;

  delete from booking_vehicle
  where booking_id = p_booking_id and property_id = p_property_id;

  insert into booking_vehicle (property_id, booking_id, registration, sort_order)
  select p_property_id, p_booking_id, plate, (ordinality - 1)::integer
  from unnest(v_vehicles) with ordinality as plates (plate, ordinality);

  update occupancy
  set unit_id = p_unit_id,
      start_date = p_check_in,
      end_date = p_check_out
  where booking_id = p_booking_id and property_id = p_property_id;

  -- Replaced wholesale rather than reconciled. prd.md §8 makes the lines the
  -- price — the total is their sum — so the honest representation of a
  -- reprice is the new set, not the old set patched. The discount line is
  -- among them, already priced against the new subtotal by the engine.
  delete from booking_line
  where booking_id = p_booking_id and property_id = p_property_id;

  -- `extra_id` joined this list on 17 September 2026 (capability F13).
  -- Without it an `extra` line arrives with nothing naming which extra it
  -- bought, `booking_line_extra_id_matches_type` refuses it, and the stock
  -- rule has nothing to count. The engine already puts it on the line; this
  -- is the statement that had been dropping it.
  insert into booking_line (
    property_id, booking_id, line_type, description,
    quantity, unit_price_cents, amount_cents, sort_order, extra_id
  )
  select
    p_property_id,
    p_booking_id,
    entry ->> 'type',
    entry ->> 'description',
    (entry ->> 'quantity')::integer,
    (entry ->> 'unitPrice')::integer,
    (entry ->> 'amount')::integer,
    (ordinality - 1)::integer,
    (entry ->> 'extraId')::uuid
  from jsonb_array_elements(p_lines) with ordinality as elements (entry, ordinality);

  v_after := jsonb_build_object(
    'unit_id', p_unit_id,
    'check_in', p_check_in,
    'check_out', p_check_out,
    'guest_name', p_guest_name,
    'guest_phone', p_guest_phone,
    'vehicles', to_jsonb(v_vehicles),
    'no_vehicle', p_no_vehicle,
    'chargeable_guests', p_chargeable_guests,
    'exempt_guests', p_exempt_guests,
    'total_cents', p_total_cents,
    'security_deposit_cents', p_security_deposit_cents,
    'discount_kind', p_discount_kind,
    'discount_value', p_discount_value,
    'discount_reason', v_discount_reason
  );

  if p_reason is not null then
    v_after := v_after || jsonb_build_object('reason', p_reason);
  end if;

  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id, p_actor_id, 'booking.amended', 'booking', p_booking_id, v_before, v_after
  );

  -- Its own verb when the discount moved, so the amendment trail and the
  -- "every discount given" lookup stay separate questions with separate
  -- answers. Fires on removal too: taking a discount away is as discretionary
  -- as giving one.
  if v_discount_changed then
    insert into audit_event (
      property_id, actor_id, action, entity_type, entity_id, before, after
    )
    values (
      p_property_id, p_actor_id, 'booking.discounted', 'booking', p_booking_id,
      jsonb_build_object(
        'kind', v_booking.discount_kind,
        'value', v_booking.discount_value,
        'reason', v_booking.discount_reason,
        'total_cents', v_booking.total_cents
      ),
      jsonb_build_object(
        'kind', p_discount_kind,
        'value', p_discount_value,
        'reason', v_discount_reason,
        'total_cents', p_total_cents
      )
    );
  end if;

  return jsonb_build_object('ok', true);

exception
  when exclusion_violation then
    return jsonb_build_object('ok', false, 'error', 'unit_unavailable');
  when foreign_key_violation then
    return jsonb_build_object('ok', false, 'error', 'unit_not_found');
end;
$function$;

create or replace function create_public_stay_booking(
  p_property_id uuid,
  p_unit_type_slug text,
  p_status text,
  p_check_in date,
  p_check_out date,
  p_guest_name text,
  p_guest_phone text,
  p_guest_email text,
  p_vehicles text[],
  p_no_vehicle boolean,
  p_chargeable_guests integer,
  p_exempt_guests integer,
  p_total_cents integer,
  p_security_deposit_cents integer,
  p_lines jsonb,
  p_access_token text,
  p_max_open_per_phone integer
)
returns jsonb
language plpgsql
as $function$
declare
  v_guest_id uuid;
  v_booking_id uuid;
  v_reference text;
  v_vehicles text[] := coalesce(p_vehicles, '{}'::text[]);
  v_email text := nullif(btrim(coalesce(p_guest_email, '')), '');
  v_open integer;
  v_candidate record;
  v_unit_id uuid;
  v_unit_ref text;
begin
  if cardinality(v_vehicles) = 0 and not p_no_vehicle then
    raise exception 'a booking needs at least one vehicle registration, or the no-vehicle exception';
  end if;

  -- How many units this phone number is already holding without having paid
  -- for any of them. The cap is the part of the abuse answer that a honeypot
  -- and a request counter cannot give: a patient human with a real browser can
  -- defeat both, and the thing worth protecting is inventory rather than
  -- bandwidth. `created_by is null` narrows it to bookings the customer made
  -- themselves — a desk that takes four advance bookings for one regular is
  -- doing its job and must not trip this.
  select count(*)
  into v_open
  from booking b
  join guest g on g.id = b.guest_id
  where b.property_id = p_property_id
    and b.created_by is null
    and b.status in ('held', 'awaiting_payment_verification')
    and g.phone = p_guest_phone;

  if v_open >= p_max_open_per_phone then
    return jsonb_build_object('ok', false, 'error', 'too_many_open_bookings');
  end if;

  -- No de-duplication, the position create_walk_in_booking() takes and for the
  -- same reason: merging two people who share a phone is worse than a
  -- duplicate row, and amend_booking() edits the guest in place on the
  -- assumption that each booking owns one.
  insert into guest (property_id, name, phone, email)
  values (p_property_id, p_guest_name, p_guest_phone, v_email)
  returning id into v_guest_id;

  v_reference := next_booking_reference();

  insert into booking (
    property_id, reference, stream, status, guest_id,
    chargeable_guests, exempt_guests, no_vehicle,
    total_cents, security_deposit_cents, access_token, created_by
  )
  values (
    p_property_id, v_reference, 'short_stay', p_status, v_guest_id,
    p_chargeable_guests, p_exempt_guests, p_no_vehicle,
    p_total_cents, p_security_deposit_cents, p_access_token, null
  )
  returning id into v_booking_id;

  insert into booking_vehicle (property_id, booking_id, registration, sort_order)
  select p_property_id, v_booking_id, plate, (ordinality - 1)::integer
  from unnest(v_vehicles) with ordinality as plates (plate, ordinality);

  -- `extra_id` joined this list on 17 September 2026 (capability F13).
  -- Without it an `extra` line arrives with nothing naming which extra it
  -- bought, `booking_line_extra_id_matches_type` refuses it, and the stock
  -- rule has nothing to count. The engine already puts it on the line; this
  -- is the statement that had been dropping it.
  insert into booking_line (
    property_id, booking_id, line_type, description,
    quantity, unit_price_cents, amount_cents, sort_order, extra_id
  )
  select
    p_property_id,
    v_booking_id,
    entry ->> 'type',
    entry ->> 'description',
    (entry ->> 'quantity')::integer,
    (entry ->> 'unitPrice')::integer,
    (entry ->> 'amount')::integer,
    (ordinality - 1)::integer,
    (entry ->> 'extraId')::uuid
  from jsonb_array_elements(p_lines) with ordinality as elements (entry, ordinality);

  -- ── The assignment ───────────────────────────────────────────────────────
  --
  -- Serialised per unit type, and the lock is not optional. Without it eight
  -- customers asking for the same type walk the same candidate list in the
  -- same order, and the exclusion constraint makes an inserting transaction
  -- WAIT on a conflicting uncommitted one rather than fail — so two of them
  -- end up holding a door each and waiting on the other's, which Postgres
  -- resolves by killing somebody's booking with "deadlock detected". That is
  -- a customer seeing an error on a building with forty free rooms, and it is
  -- what lib/db/public-bookings.test.ts caught.
  --
  -- Per type rather than per property, so a family booking a semi-detached
  -- never queues behind somebody booking an apartment. Transaction-scoped, so
  -- it is released by the commit or rollback that settles the booking.
  --
  -- **This does not replace the constraint**, it only removes the cycle among
  -- public callers. The desk takes no such lock, so a walk-in and a customer
  -- can still race for the same door — and the exclusion constraint is what
  -- decides that, exactly as capability G1 promises. The handlers below are
  -- what turn its refusal into the next room rather than an apology.
  perform pg_advisory_xact_lock(hashtext(p_property_id::text || ':assign:' || p_unit_type_slug));

  -- available_units() applies the identical half-open overlap and
  -- out-of-service rules the constraint and the trigger apply, so an ordinary
  -- call finds a free door on its first attempt.
  for v_candidate in
    select id, ref
    from available_units(p_property_id, p_check_in, p_check_out, p_unit_type_slug, null)
  loop
    begin
      insert into occupancy (
        property_id, unit_id, booking_id, occupancy_type, status, start_date, end_date
      )
      values (
        p_property_id, v_candidate.id, v_booking_id, 'short_stay', p_status,
        p_check_in, p_check_out
      );

      v_unit_id := v_candidate.id;
      v_unit_ref := v_candidate.ref;
      exit;
    exception
      -- Somebody took this door between the read and this statement. Not a
      -- failure of the booking — only of this candidate.
      when exclusion_violation then
        null;
      -- And the unit went out of service in the same window. Same answer:
      -- try the next one. Named rather than swallowed with `others`, which
      -- would hide a genuine fault as a full building.
      when sqlstate 'PV002' then
        null;
    end;
  end loop;

  if v_unit_id is null then
    -- Raised rather than returned, so the guest and the booking written above
    -- are rolled back by this function's own exception handler. A guest row
    -- left behind by a booking that never existed is a data-protection
    -- liability with no purpose (prd.md §13) — the position
    -- no-double-booking.test.ts already asserts for the walk-in path.
    raise exception 'no unit of this type is free' using errcode = 'PV004';
  end if;

  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id,
    null,
    'booking.created_public',
    'booking',
    v_booking_id,
    null,
    jsonb_build_object(
      'reference', v_reference,
      'status', p_status,
      'stream', 'short_stay',
      'unit_id', v_unit_id,
      'unit_ref', v_unit_ref,
      'check_in', p_check_in,
      'check_out', p_check_out,
      'total_cents', p_total_cents,
      'security_deposit_cents', p_security_deposit_cents,
      'vehicles', to_jsonb(v_vehicles),
      'no_vehicle', p_no_vehicle
    )
  );

  return jsonb_build_object(
    'ok', true,
    'booking_id', v_booking_id,
    'reference', v_reference,
    'unit_id', v_unit_id,
    'unit_ref', v_unit_ref,
    'access_token', p_access_token
  );

exception
  when sqlstate 'PV004' then
    return jsonb_build_object('ok', false, 'error', 'unit_unavailable');
  when unique_violation then
    -- The access token collided, which at 128 bits of randomness means the
    -- caller reused one. Returned rather than raised so the action can mint
    -- another and try again instead of showing a customer a stack trace.
    return jsonb_build_object('ok', false, 'error', 'token_collision');
end;
$function$;
