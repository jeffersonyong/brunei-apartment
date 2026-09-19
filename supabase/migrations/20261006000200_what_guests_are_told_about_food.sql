-- ═══════════════════════════════════════════════════════════════════════════
-- What guests are told about food (Jeff, 19 September 2026).
--
-- There is no restaurant at Palm Villa. An outside provider leaves a menu at
-- the poolside tables and delivers, and a confirmed guest is told so — on
-- their booking page, in their confirmation email and on the food page. The
-- provider can change, so both halves are staff's to edit from Website
-- settings → Food:
--
--   1. The flyer is a photograph like any other on the site, in a sixth fixed
--      place, `food-menu`. Everything F7 built — the upload, the stale check,
--      the retirement and sweep, the audit events — applies unchanged.
--   2. The words and the number are one row per property, `food_notice`, with
--      a writer of the privacy policy draft's shape. An empty notice is how
--      it is switched off: nothing is shown anywhere.
--
-- Both answer to `site_image.manage`, the precedent the front-page switch for
-- a facility set (20261004000100): the notice is the flyer's caption, and a
-- new permission would be a second tick box for one screen.
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. The food menu is a place a photograph can go.
--
-- Mirrors SITE_IMAGE_SLOTS and slotLabel() in lib/domain/site-image.ts.
-- ═══════════════════════════════════════════════════════════════════════════

alter table site_image drop constraint site_image_slot_check;

alter table site_image add constraint site_image_slot_check
  check (slot in ('hero', 'feed-1', 'feed-2', 'feed-3', 'feed-4', 'food-menu'));

create or replace function site_image_name(p_slot text, p_unit_type_id uuid, p_facility_id uuid)
returns text
language sql
stable
as $function$
  select case
    when p_slot = 'hero' then 'Front page'
    when p_slot = 'food-menu' then 'Food menu'
    when p_slot like 'feed-%' then 'Follow along — tile ' || substr(p_slot, 6)
    when p_unit_type_id is not null then (select t.name from unit_type t where t.id = p_unit_type_id)
    when p_facility_id is not null then (select f.name from facility f where f.id = p_facility_id)
  end
$function$;

-- place_site_image() as 20260923000100 wrote it, with `food-menu` added to
-- the slots it accepts and nothing else changed.
create or replace function place_site_image(
  p_property_id uuid,
  p_image_id uuid,
  p_target text,
  p_slug text,
  p_expected_current_id uuid,
  p_storage_key text,
  p_mime_type text,
  p_byte_size integer,
  p_alt_text text,
  p_focus text,
  p_actor_id uuid
)
returns jsonb
language plpgsql
as $function$
declare
  v_slot text;
  v_unit_type_id uuid;
  v_facility_id uuid;
  v_name text;
  v_alt_text text;
  v_current site_image%rowtype;
  v_object_size bigint;
  v_size integer;
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'error', 'actor_required');
  end if;

  -- ── Where it goes ───────────────────────────────────────────────────────

  if p_target = 'slot' then
    if p_slug is null or p_slug not in (
      'hero', 'feed-1', 'feed-2', 'feed-3', 'feed-4', 'food-menu'
    ) then
      return jsonb_build_object('ok', false, 'error', 'not_found');
    end if;

    v_slot := p_slug;
  elsif p_target = 'unit_type' then
    select t.id into v_unit_type_id
    from unit_type t
    where t.property_id = p_property_id and t.slug = p_slug;

    if not found then
      return jsonb_build_object('ok', false, 'error', 'not_found');
    end if;
  elsif p_target = 'facility' then
    select f.id into v_facility_id
    from facility f
    where f.property_id = p_property_id and f.slug = p_slug;

    if not found then
      return jsonb_build_object('ok', false, 'error', 'not_found');
    end if;
  else
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  -- ── What it is ──────────────────────────────────────────────────────────

  if p_mime_type is null or p_mime_type not in ('image/jpeg', 'image/png', 'image/webp') then
    return jsonb_build_object('ok', false, 'error', 'not_an_image');
  end if;

  v_alt_text := btrim(regexp_replace(coalesce(p_alt_text, ''), '\s+', ' ', 'g'));

  if v_alt_text = '' or char_length(v_alt_text) > 200 then
    return jsonb_build_object('ok', false, 'error', 'alt_text_invalid');
  end if;

  if p_focus is null or p_focus not in (
    'top-left', 'top', 'top-right', 'left', 'center', 'right',
    'bottom-left', 'bottom', 'bottom-right'
  ) then
    return jsonb_build_object('ok', false, 'error', 'focus_invalid');
  end if;

  -- Flat under this property and nobody else's (architecture.md §8.1).
  if p_storage_key is null or p_storage_key not like (p_property_id::text || '/%') then
    return jsonb_build_object('ok', false, 'error', 'storage_key_invalid');
  end if;

  -- ── One writer per place ────────────────────────────────────────────────
  --
  -- An advisory lock rather than a row lock, for the reason 20260913000100
  -- gives: the first photograph in a place has no row to lock, and two first
  -- uploads would otherwise both find it empty. Keyed on the place, so two
  -- different places never wait on each other, and taken on nothing F3's
  -- settings save locks, so it adds no lock order to reason about.
  perform pg_advisory_xact_lock(
    hashtext(p_property_id::text || ':site_image:' || p_target || ':' || p_slug)
  );

  select si.* into v_current
  from site_image si
  where si.property_id = p_property_id
    and si.retired_at is null
    and (
      si.slot = v_slot
      or si.unit_type_id = v_unit_type_id
      or si.facility_id = v_facility_id
    )
  for update;

  if v_current.id is distinct from p_expected_current_id then
    return jsonb_build_object('ok', false, 'error', 'stale');
  end if;

  -- ── The object actually landed ──────────────────────────────────────────
  --
  -- Storage keeps its objects in this database, so this is a lookup rather
  -- than an act of faith, and the size is read from here rather than believed
  -- from the caller (attach_document, 20260907000100).
  select (o.metadata ->> 'size')::bigint into v_object_size
  from storage.objects o
  where o.bucket_id = 'site-images' and o.name = p_storage_key;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'object_missing');
  end if;

  v_size := coalesce(v_object_size, p_byte_size)::integer;

  if v_size is null or v_size <= 0 then
    return jsonb_build_object('ok', false, 'error', 'object_empty');
  end if;

  if v_size > 4194304 then
    return jsonb_build_object('ok', false, 'error', 'too_large');
  end if;

  -- ── Write ───────────────────────────────────────────────────────────────

  if v_current.id is not null then
    update site_image
    set retired_at = now(), retired_reason = 'replaced', retired_by = p_actor_id
    where id = v_current.id;
  end if;

  insert into site_image (
    id, property_id, slot, unit_type_id, facility_id, storage_key,
    mime_type, byte_size, alt_text, focus, uploaded_by
  )
  values (
    p_image_id, p_property_id, v_slot, v_unit_type_id, v_facility_id, p_storage_key,
    p_mime_type, v_size, v_alt_text, p_focus, p_actor_id
  );

  v_name := site_image_name(v_slot, v_unit_type_id, v_facility_id);

  -- Two inserts rather than one with the verb in a `case`: the audit vocabulary
  -- test reads every (verb, entity) pair out of the migrations, and a verb
  -- inside a `case` is one it cannot see (lib/domain/audit-label.test.ts).
  if v_current.id is null then
    insert into audit_event (
      property_id, actor_id, action, entity_type, entity_id, before, after
    )
    values (
      p_property_id, p_actor_id, 'site_image.added', 'site_image', p_image_id,
      null,
      jsonb_build_object(
        'name', v_name, 'alt_text', v_alt_text, 'focus', p_focus,
        'mime_type', p_mime_type, 'byte_size', v_size
      )
    );
  else
    insert into audit_event (
      property_id, actor_id, action, entity_type, entity_id, before, after
    )
    values (
      p_property_id, p_actor_id, 'site_image.replaced', 'site_image', p_image_id,
      jsonb_build_object(
        'name', v_name, 'image_id', v_current.id,
        'alt_text', v_current.alt_text, 'focus', v_current.focus
      ),
      jsonb_build_object(
        'name', v_name, 'alt_text', v_alt_text, 'focus', p_focus,
        'mime_type', p_mime_type, 'byte_size', v_size
      )
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'retired', case
      when v_current.id is null then null
      else jsonb_build_object('id', v_current.id, 'storage_key', v_current.storage_key)
    end
  );
end;
$function$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. The notice.
-- ═══════════════════════════════════════════════════════════════════════════

create table food_notice (
  property_id uuid primary key references property (id) on delete cascade,
  -- Paragraphs separated by line breaks. Empty means nothing is shown.
  -- Mirrors MAX_FOOD_NOTICE_LENGTH in lib/domain/food-notice.ts.
  body text not null default '' check (char_length(body) <= 600),
  -- Shown as its own "Call" line, so a phone can dial it. Mirrors
  -- MAX_FOOD_PHONE_LENGTH and the pattern checkFoodNoticeDraft() applies.
  phone text not null default '' check (
    char_length(phone) <= 30 and (phone = '' or phone ~ '^\+?[0-9() -]+$')
  ),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table food_notice enable row level security;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. The writer.
--
-- The privacy policy draft's construction (20260930000100): one advisory lock
-- per property, and `stale` when the notice has moved since the editor was
-- opened. The text arrives already tidied by checkFoodNoticeDraft(); the
-- checks here are the table's, restated as refusals rather than errors.
-- ═══════════════════════════════════════════════════════════════════════════

create function save_food_notice(
  p_property_id uuid,
  p_body text,
  p_phone text,
  p_expected_updated_at timestamptz,
  p_actor_id uuid
)
returns jsonb
language plpgsql
as $function$
declare
  v_row food_notice%rowtype;
  v_body text := coalesce(p_body, '');
  v_phone text := coalesce(p_phone, '');
  v_updated_at timestamptz;
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'error', 'actor_required');
  end if;

  if char_length(v_body) > 600 then
    return jsonb_build_object('ok', false, 'error', 'too_long');
  end if;

  if char_length(v_phone) > 30 or (v_phone <> '' and v_phone !~ '^\+?[0-9() -]+$') then
    return jsonb_build_object('ok', false, 'error', 'phone_invalid');
  end if;

  perform pg_advisory_xact_lock(hashtext(p_property_id::text || ':food_notice'));

  select * into v_row
  from food_notice n
  where n.property_id = p_property_id
  for update;

  if not found then
    if p_expected_updated_at is not null then
      return jsonb_build_object('ok', false, 'error', 'stale');
    end if;

    -- No row is the same as an empty notice, so saving one writes nothing.
    if v_body = '' and v_phone = '' then
      return jsonb_build_object('ok', true, 'changed', false, 'updated_at', null);
    end if;

    insert into food_notice (property_id, body, phone, updated_by)
    values (p_property_id, v_body, v_phone, p_actor_id)
    returning updated_at into v_updated_at;

    insert into audit_event (
      property_id, actor_id, action, entity_type, entity_id, before, after
    )
    values (
      p_property_id, p_actor_id, 'food_notice.updated', 'food_notice', p_property_id,
      jsonb_build_object('body', '', 'phone', ''),
      jsonb_build_object('body', v_body, 'phone', v_phone)
    );

    return jsonb_build_object('ok', true, 'changed', true, 'updated_at', v_updated_at);
  end if;

  if v_row.updated_at is distinct from p_expected_updated_at then
    return jsonb_build_object('ok', false, 'error', 'stale');
  end if;

  if v_row.body = v_body and v_row.phone = v_phone then
    return jsonb_build_object('ok', true, 'changed', false, 'updated_at', v_row.updated_at);
  end if;

  update food_notice
  set body = v_body,
    phone = v_phone,
    updated_at = now(),
    updated_by = p_actor_id
  where property_id = p_property_id
  returning updated_at into v_updated_at;

  -- Both halves on both sides, so the trail reads as a before-and-after even
  -- when only the number changed.
  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id, p_actor_id, 'food_notice.updated', 'food_notice', p_property_id,
    jsonb_build_object('body', v_row.body, 'phone', v_row.phone),
    jsonb_build_object('body', v_body, 'phone', v_phone)
  );

  return jsonb_build_object('ok', true, 'changed', true, 'updated_at', v_updated_at);
end;
$function$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. What a property starts with, as the client wrote it.
--
-- Called here for the property that exists, and by seed.sql for one reset
-- from nothing, the way seed_booking_extras() is. The number is the flyer's.
-- ═══════════════════════════════════════════════════════════════════════════

create function seed_food_notice(p_property_id uuid)
returns void
language sql
as $function$
  insert into food_notice (property_id, body, phone)
  values (
    p_property_id,
    E'Please note that there is no restaurant at Palm Villa. However, a food menu is available at the poolside tables for your convenience.\n'
      || E'To place an order, contact the food provider directly.\n'
      || E'FREE DELIVERY is available for orders of BND 20 and above.',
    '+673 333 5410'
  )
  on conflict (property_id) do nothing
$function$;

select seed_food_notice(id) from property;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. The audit trail names the notice.
--
-- audit_event_summary as 20260930000100 defined it, with one branch added.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace view audit_event_summary
with (security_invoker = true)
as
select
  e.id,
  e.property_id,
  e.actor_id,
  e.action,
  split_part(e.action, '.', 1) as action_family,
  e.entity_type,
  e.entity_id,
  e.before,
  e.after,
  e.at,
  case e.entity_type
    when 'booking' then (select b.reference from booking b where b.id = e.entity_id)
    when 'payment' then (
      select b.reference from payment p join booking b on b.id = p.booking_id
      where p.id = e.entity_id
    )
    when 'deposit' then (
      select b.reference from deposit d join booking b on b.id = d.booking_id
      where d.id = e.entity_id
    )
    when 'deposit_charge' then (
      select b.reference
      from deposit_charge c
      join deposit d on d.id = c.deposit_id
      join booking b on b.id = d.booking_id
      where c.id = e.entity_id
    )
    when 'inspection' then (
      select b.reference
      from inspection i
      join occupancy o on o.id = i.occupancy_id
      join booking b on b.id = o.booking_id
      where i.id = e.entity_id
    )
    when 'document' then (
      select b.reference from document doc join booking b on b.id = doc.booking_id
      where doc.id = e.entity_id
    )
    when 'unit' then (select u.ref from unit u where u.id = e.entity_id)
    when 'unit_type' then (select t.name from unit_type t where t.id = e.entity_id)
    when 'staff_role' then (select r.name from staff_role r where r.id = e.entity_id)
    when 'cash_banking' then (
      select to_char(c.business_date, 'YYYY-MM-DD') from cash_banking c where c.id = e.entity_id
    )
    when 'day_pass_band' then (
      select b.label from day_pass_age_band b where b.id = e.entity_id
    )
    when 'day_pass_bundle' then (
      select d.label from day_pass_bundle d where d.id = e.entity_id
    )
    when 'facility' then (select f.name from facility f where f.id = e.entity_id)
    when 'bank_account' then (
      select a.bank_name || ' ' || a.account_number from bank_account a where a.id = e.entity_id
    )
    when 'property' then (select p.name from property p where p.id = e.entity_id)
    when 'document_retention' then (select p.name from property p where p.id = e.entity_id)
    when 'site_image' then (
      select site_image_name(si.slot, si.unit_type_id, si.facility_id)
      from site_image si
      where si.id = e.entity_id
    )
    when 'faq' then (select q.question from faq q where q.id = e.entity_id)
    -- Every version is "the privacy policy"; which one is the event's date.
    when 'privacy_policy_version' then (
      select 'Privacy policy' from privacy_policy_version v where v.id = e.entity_id
    )
    -- One notice per property, keyed by the property, so it is always "Food".
    when 'food_notice' then 'Food'
    else null
  end as subject_label
from audit_event e;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. Grants. Service-role only, like every other writer.
-- ═══════════════════════════════════════════════════════════════════════════

revoke all on food_notice from public, anon, authenticated;
grant select, insert, update, delete on food_notice to service_role;

revoke all on audit_event_summary from public, anon, authenticated;
grant select on audit_event_summary to service_role;

revoke execute on function site_image_name(text, uuid, uuid) from public, anon, authenticated;
revoke execute on function place_site_image(
  uuid, uuid, text, text, uuid, text, text, integer, text, text, uuid
) from public, anon, authenticated;
revoke execute on function save_food_notice(uuid, text, text, timestamptz, uuid)
  from public, anon, authenticated;
revoke execute on function seed_food_notice(uuid) from public, anon, authenticated;

grant execute on function site_image_name(text, uuid, uuid) to service_role;
grant execute on function place_site_image(
  uuid, uuid, text, text, uuid, text, text, integer, text, text, uuid
) to service_role;
grant execute on function save_food_notice(uuid, text, text, timestamptz, uuid) to service_role;
grant execute on function seed_food_notice(uuid) to service_role;
