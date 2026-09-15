-- ═══════════════════════════════════════════════════════════════════════════
-- The privacy policy staff write and publish (capability F10).
--
-- The public site asks a guest for their IC and names, phones and car
-- registrations on every booking, and nothing on it said what happens to any
-- of that. Brunei's Personal Data Protection Order 2025 commenced on
-- 1 January 2026 (prd.md §13). Jeff asked on 15 September 2026 for staff to
-- write the notice from the portal, starting from a template if they want one,
-- and publish it when the wording is theirs: **what it says is the client's to
-- approve**, and this migration makes no claim that any wording is compliant.
--
-- ── Two tables, because a draft and a published notice are different facts ─
--
-- `privacy_policy` is the working copy: one row per property, saved as often
-- as somebody likes, never seen by a guest. `privacy_policy_version` is what
-- the website said and from when — a row per publish, never edited. The
-- question the PDPO actually asks is "what were guests told on the day this IC
-- arrived", and a single row overwritten on each publish could not answer it.
--
-- ── What is audited ───────────────────────────────────────────────────────
--
-- Publishing, and only publishing. A draft save changes nothing anybody
-- outside the portal can see, and an event carrying fifty thousand characters
-- per keystroke-sized save would be a trail nobody reads. The draft row keeps
-- who last saved it. A published version is its own record, so its event
-- carries its size rather than a second copy of the text.
--
-- Four parts, in dependency order.
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. The tables.
-- ═══════════════════════════════════════════════════════════════════════════

create table privacy_policy (
  -- One working copy per property, so the property is the key.
  property_id uuid primary key references property (id) on delete cascade,

  -- Mirrors MAX_PRIVACY_POLICY_LENGTH in lib/domain/privacy-policy.ts. Empty
  -- is allowed: somebody may clear the draft to start again.
  draft text not null default '' check (char_length(draft) <= 50000),

  updated_at timestamptz not null default now(),
  -- Set null when the account is deleted, as `faq.updated_by` is: who
  -- published what is in the audit trail, and a draft is nobody's record.
  updated_by uuid references auth.users (id) on delete set null
);

create table privacy_policy_version (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references property (id) on delete cascade,

  -- Checked the way publish_privacy_policy() checks it, for a row that did not
  -- come through it. The `[Fill in: …]` rule is not repeated as a CHECK: it is
  -- the template's convention, not a property of a published notice.
  -- `~ '\S'` rather than `btrim(body) <> ''`: btrim strips spaces only, and a
  -- body of nothing but newlines is as empty as one of nothing at all.
  body text not null check (body ~ '\S' and char_length(body) <= 50000),

  published_at timestamptz not null default now(),
  published_by uuid references auth.users (id) on delete set null,

  unique (property_id, id)
);

-- The public page, the footer link and the portal all ask for the newest.
create index privacy_policy_version_latest_idx
  on privacy_policy_version (property_id, published_at desc);

-- Enabled with no policies, like every table since 20260829000800. The
-- published text is public in substance, but it is read through lib/db like
-- everything else.
alter table privacy_policy enable row level security;
alter table privacy_policy_version enable row level security;

comment on table privacy_policy is
  'The privacy policy as staff are writing it (capability F10). Never shown to a guest; publish_privacy_policy() copies it into privacy_policy_version.';

comment on table privacy_policy_version is
  'Each privacy policy the website has shown, and from when (capability F10). The newest row is the one on /privacy. Never updated.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. The writers.
--
-- Both take one advisory lock per property's policy, so a save and a publish
-- cannot interleave, and both refuse as `stale` when the draft has moved since
-- the editor was opened — the construction update_faq() uses. A draft that has
-- never been saved has no `updated_at`, so the editor sends null and a row
-- that has appeared since is stale too.
-- ═══════════════════════════════════════════════════════════════════════════

create function save_privacy_policy_draft(
  p_property_id uuid,
  p_draft text,
  p_expected_updated_at timestamptz,
  p_actor_id uuid
)
returns jsonb
language plpgsql
as $function$
declare
  v_row privacy_policy%rowtype;
  v_draft text := coalesce(p_draft, '');
  v_updated_at timestamptz;
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'error', 'actor_required');
  end if;

  if char_length(v_draft) > 50000 then
    return jsonb_build_object('ok', false, 'error', 'too_long');
  end if;

  perform pg_advisory_xact_lock(hashtext(p_property_id::text || ':privacy_policy'));

  select * into v_row
  from privacy_policy p
  where p.property_id = p_property_id
  for update;

  if not found then
    if p_expected_updated_at is not null then
      return jsonb_build_object('ok', false, 'error', 'stale');
    end if;

    -- Nothing to save over, and nothing written: no row is the same as empty.
    if v_draft = '' then
      return jsonb_build_object('ok', true, 'changed', false, 'updated_at', null);
    end if;

    insert into privacy_policy (property_id, draft, updated_by)
    values (p_property_id, v_draft, p_actor_id)
    returning updated_at into v_updated_at;

    return jsonb_build_object('ok', true, 'changed', true, 'updated_at', v_updated_at);
  end if;

  if v_row.updated_at is distinct from p_expected_updated_at then
    return jsonb_build_object('ok', false, 'error', 'stale');
  end if;

  if v_row.draft = v_draft then
    return jsonb_build_object('ok', true, 'changed', false, 'updated_at', v_row.updated_at);
  end if;

  update privacy_policy
  set draft = v_draft,
    updated_at = now(),
    updated_by = p_actor_id
  where property_id = p_property_id
  returning updated_at into v_updated_at;

  return jsonb_build_object('ok', true, 'changed', true, 'updated_at', v_updated_at);
end;
$function$;

-- Saves the text as the draft and puts it on the website, in one transaction.
--
-- The editor sends what is on the screen rather than asking for "the saved
-- draft" to be published, so what somebody read in the confirmation is exactly
-- what goes live. Publishing the text the website already shows writes
-- nothing and returns `changed: false`.
create function publish_privacy_policy(
  p_property_id uuid,
  p_body text,
  p_expected_updated_at timestamptz,
  p_actor_id uuid
)
returns jsonb
language plpgsql
as $function$
declare
  -- Every kind of whitespace trimmed, as tidyPrivacyPolicy() trims it; btrim()
  -- alone would leave newlines and let a blank policy through.
  v_body text := regexp_replace(coalesce(p_body, ''), '^\s+|\s+$', '', 'g');
  v_row privacy_policy%rowtype;
  v_has_row boolean;
  v_latest privacy_policy_version%rowtype;
  v_has_latest boolean;
  v_updated_at timestamptz;
  v_version_id uuid;
  v_published_at timestamptz;
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'error', 'actor_required');
  end if;

  if v_body = '' then
    return jsonb_build_object('ok', false, 'error', 'empty');
  end if;

  if char_length(v_body) > 50000 then
    return jsonb_build_object('ok', false, 'error', 'too_long');
  end if;

  -- Mirrors unfilledPlaceholders(): a template gap left in cannot go live.
  if v_body ~* '\[fill in:' then
    return jsonb_build_object('ok', false, 'error', 'unfilled');
  end if;

  perform pg_advisory_xact_lock(hashtext(p_property_id::text || ':privacy_policy'));

  select * into v_row
  from privacy_policy p
  where p.property_id = p_property_id
  for update;

  v_has_row := found;

  if (v_has_row and v_row.updated_at is distinct from p_expected_updated_at)
    or (not v_has_row and p_expected_updated_at is not null) then
    return jsonb_build_object('ok', false, 'error', 'stale');
  end if;

  if not v_has_row then
    insert into privacy_policy (property_id, draft, updated_by)
    values (p_property_id, v_body, p_actor_id)
    returning updated_at into v_updated_at;
  elsif v_row.draft is distinct from v_body then
    update privacy_policy
    set draft = v_body,
      updated_at = now(),
      updated_by = p_actor_id
    where property_id = p_property_id
    returning updated_at into v_updated_at;
  else
    v_updated_at := v_row.updated_at;
  end if;

  select * into v_latest
  from privacy_policy_version v
  where v.property_id = p_property_id
  order by v.published_at desc
  limit 1;

  v_has_latest := found;

  if v_has_latest and v_latest.body = v_body then
    return jsonb_build_object(
      'ok', true, 'changed', false, 'updated_at', v_updated_at,
      'version_id', v_latest.id, 'published_at', v_latest.published_at
    );
  end if;

  insert into privacy_policy_version (property_id, body, published_by)
  values (p_property_id, v_body, p_actor_id)
  returning id, published_at into v_version_id, v_published_at;

  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id, p_actor_id, 'privacy_policy.published', 'privacy_policy_version', v_version_id,
    case
      when v_has_latest then jsonb_build_object(
        'name', 'Privacy policy',
        'version_id', v_latest.id,
        'published_at', v_latest.published_at,
        'characters', char_length(v_latest.body)
      )
      else null
    end,
    jsonb_build_object(
      'name', 'Privacy policy',
      'characters', char_length(v_body),
      'first', not v_has_latest
    )
  );

  return jsonb_build_object(
    'ok', true, 'changed', true, 'updated_at', v_updated_at,
    'version_id', v_version_id, 'published_at', v_published_at
  );
end;
$function$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. `privacy_policy.manage` — who may change what the site promises.
--
-- Its own string, like `site_image.manage` and `faq.manage`: whoever drafts
-- the notice should not also be handed pricing, roles and the audit log. Not
-- `faq.manage` either — an FAQ answers a question, and this is what the
-- business commits to about personal data. Seeded to Admin only. Granted here
-- as well as in seed.sql because production moves by `db push`, which runs no
-- seed.
-- ═══════════════════════════════════════════════════════════════════════════

alter table role_permission drop constraint role_permission_permission_check;

alter table role_permission add constraint role_permission_permission_check check (
  permission in (
    'booking.view', 'booking.create', 'booking.amend', 'booking.cancel',
    'booking.override_hold', 'booking.discount', 'booking.check_in', 'booking.check_out',
    'day_pass.admit', 'payment.verify', 'payment.record_cash', 'inspection.record',
    'charge.create', 'charge.waive', 'deposit.approve_release', 'deposit.waive',
    'unit.manage', 'tenancy.manage', 'config.manage', 'report.view',
    'document.view_identity', 'site_image.manage', 'faq.manage', 'privacy_policy.manage'
  )
);

insert into role_permission (property_id, role_id, permission)
select r.property_id, r.id, 'privacy_policy.manage'
from staff_role r
where r.slug = 'admin'
on conflict do nothing;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. The audit trail names a published policy, and the grants.
--
-- audit_event_summary as 20260928000100 defined it, with one branch added.
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
    else null
  end as subject_label
from audit_event e;

-- Service-role only, like every other writer. A published version is never
-- updated, so that grant is withheld; delete is kept for the integration tests,
-- which remove the versions they publish so the local site never shows one.
revoke all on privacy_policy from public, anon, authenticated;
grant select, insert, update, delete on privacy_policy to service_role;

revoke all on privacy_policy_version from public, anon, authenticated;
grant select, insert, delete on privacy_policy_version to service_role;

revoke all on audit_event_summary from public, anon, authenticated;
grant select on audit_event_summary to service_role;

revoke execute on function save_privacy_policy_draft(uuid, text, timestamptz, uuid)
  from public, anon, authenticated;
revoke execute on function publish_privacy_policy(uuid, text, timestamptz, uuid)
  from public, anon, authenticated;

grant execute on function save_privacy_policy_draft(uuid, text, timestamptz, uuid)
  to service_role;
grant execute on function publish_privacy_policy(uuid, text, timestamptz, uuid)
  to service_role;
