-- ═══════════════════════════════════════════════════════════════════════════
-- A facility the front page leaves out (capability F7).
--
-- Jeff asked on 18 September 2026 for staff to be able to keep a facility's
-- card off the landing page from the Photos tab — for a facility nobody has a
-- photograph of yet, or one the business would rather not advertise.
--
-- ── What it hides, and what it does not ───────────────────────────────────
--
-- **Only the card in the landing page's day-pass section.** Whether the pass
-- admits a facility is still `included_in_day_pass`, set in Property settings,
-- and `/day-pass` keeps listing everything the pass admits before it takes a
-- booking: a customer is told what they are buying whether or not there is a
-- picture of it. Two questions, two columns — folding this into the tick would
-- have made "we have no photo of the gym" mean "the pass no longer admits the
-- gym".
--
-- Shown by default, so every facility that exists today keeps its card and a
-- new one gets one until somebody decides otherwise.
--
-- ── Its own writer ────────────────────────────────────────────────────────
--
-- Not part of save_day_pass_settings(). That save is `config.manage`'s and
-- carries the settings concurrency token; this one is `site_image.manage`'s,
-- made from the Photos tab one facility at a time, like a photograph. Like
-- set_faq_featured() it has no stale check — the choice is the whole of the
-- write, so there is nothing of somebody else's for it to undo — and it leaves
-- the settings token alone, so it never makes an open Day pass tab refuse its
-- save. save_facilities() names its columns, so a day-pass save never touches
-- this one either.
-- ═══════════════════════════════════════════════════════════════════════════

alter table facility add column shown_on_site boolean not null default true;

comment on column facility.shown_on_site is
  'Whether the landing page shows this facility''s card in its day-pass section (capability F7). Presentation only: what the pass admits is included_in_day_pass.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. The writer.
-- ═══════════════════════════════════════════════════════════════════════════

create function set_facility_shown_on_site(
  p_property_id uuid,
  p_slug text,
  p_shown boolean,
  p_actor_id uuid
)
returns jsonb
language plpgsql
as $function$
declare
  v_facility facility%rowtype;
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'error', 'actor_required');
  end if;

  if p_shown is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_value');
  end if;

  select * into v_facility
  from facility f
  where f.property_id = p_property_id and f.slug = p_slug
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_facility.shown_on_site = p_shown then
    return jsonb_build_object('ok', true, 'changed', false);
  end if;

  update facility set shown_on_site = p_shown where id = v_facility.id;

  -- Two inserts rather than one with the verb in a `case`: the audit vocabulary
  -- test reads every (verb, entity) pair out of the migrations, and a verb
  -- inside a `case` is one it cannot see (lib/domain/audit-label.test.ts). The
  -- name rides along so the event still says which facility after a removal.
  if p_shown then
    insert into audit_event (
      property_id, actor_id, action, entity_type, entity_id, before, after
    )
    values (
      p_property_id, p_actor_id, 'facility.shown', 'facility', v_facility.id,
      jsonb_build_object('name', v_facility.name, 'shown_on_site', false),
      jsonb_build_object('name', v_facility.name, 'shown_on_site', true)
    );
  else
    insert into audit_event (
      property_id, actor_id, action, entity_type, entity_id, before, after
    )
    values (
      p_property_id, p_actor_id, 'facility.hidden', 'facility', v_facility.id,
      jsonb_build_object('name', v_facility.name, 'shown_on_site', true),
      jsonb_build_object('name', v_facility.name, 'shown_on_site', false)
    );
  end if;

  return jsonb_build_object('ok', true, 'changed', true);
end;
$function$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. property_settings(), with the column.
--
-- 20261003000100's definition with one key added to each facility, so the
-- Photos tab and the landing page read it the same way the Day pass tab reads
-- the tick.
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
        'shown_on_site', f.shown_on_site,
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

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Grants. The service role only, like every other writer: the permission
-- is checked in the server action before this is called (architecture.md §4).
-- ═══════════════════════════════════════════════════════════════════════════

revoke execute on function set_facility_shown_on_site(uuid, text, boolean, uuid)
  from public, anon, authenticated;
grant execute on function set_facility_shown_on_site(uuid, text, boolean, uuid) to service_role;
