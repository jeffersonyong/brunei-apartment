-- ═══════════════════════════════════════════════════════════════════════════
-- The questions staff answer (capability F9, and A10 rebuilt on it).
--
-- The FAQ was copy in code (app/(public)/_content/faq.ts). Jeff asked on
-- 14 September 2026 for staff to manage it — add, edit and remove questions,
-- and choose which of them the landing page shows — because the questions
-- change as the business does, and each change was a developer deploy. It is
-- the argument capability F7 already won for the photographs.
--
-- ── What is kept from the copy it replaces ────────────────────────────────
--
-- **No figure is typed into an answer.** An answer is plain text that asks for
-- a live figure by name — `{security deposit}` — and lib/domain/faq.ts fills
-- it in from Property settings when the page renders. The database stores the
-- braces, not the figures, so a rate changed in settings is the rate every
-- answer quotes on the next page load. The vocabulary of figures is code, and
-- only code checks it (checkFaqDraft); nothing here needs to know it.
--
-- ── What is not ───────────────────────────────────────────────────────────
--
-- The page asked eight questions it could not answer, each with a "to confirm"
-- marker. **They are not seeded** (Jeff, 14 September 2026): with staff able to
-- add an answer the day it is agreed, an unanswered question on a public page
-- is a gap somebody can close from the portal instead.
--
-- ── What a row is ─────────────────────────────────────────────────────────
--
-- One question and its answer, under one of five fixed topics, in an order
-- within that topic. Deleted rather than retired when removed: unlike a
-- photograph there is no file to chase and nothing points at it but the audit
-- trail, whose events carry the question as `name` for exactly that reason.
--
-- Six parts, in dependency order.
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. The table.
-- ═══════════════════════════════════════════════════════════════════════════

create table faq (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references property (id) on delete cascade,

  -- The answer's address on the FAQs page, `/faq#<slug>`. Derived from the
  -- question once, when it is added, and never moved by a rewording: staff
  -- send people to a single answer over WhatsApp. Mirrors slugFromQuestion().
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),

  -- Mirrors FAQ_TOPICS in lib/domain/faq.ts. Fixed rather than a table of
  -- their own (Jeff, 14 September 2026).
  topic text not null check (
    topic in ('day-passes', 'staying', 'paying', 'changing-and-arriving', 'anything-else')
  ),

  -- Mirrors MAX_QUESTION_LENGTH and MAX_ANSWER_LENGTH.
  question text not null check (btrim(question) <> '' and char_length(question) <= 200),
  answer text not null check (btrim(answer) <> '' and char_length(answer) <= 2000),

  -- On the landing page as well as the FAQs page. At most six at once, which
  -- the writers enforce under the property's FAQ lock (MAX_FEATURED_FAQS).
  featured boolean not null default false,

  -- The order within the topic. Relative: gaps mean nothing.
  sort_order integer not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Null for a seeded FAQ, which nobody wrote. Set null rather than blocking
  -- when the account is deleted: the audit trail keeps who wrote what, and a
  -- question on the website is not a record anybody's history rests on.
  updated_by uuid references auth.users (id) on delete set null,

  unique (property_id, id),
  unique (property_id, slug),

  -- Deferred, so move_faq() can swap two neighbours in one statement.
  constraint faq_one_place_in_its_topic unique (property_id, topic, sort_order)
    deferrable initially deferred
);

-- Enabled with no policies, like every table since 20260829000800. The rows
-- are public in substance, but they are read through lib/db like everything
-- else; the anon key has no business with this table.
alter table faq enable row level security;

comment on table faq is
  'The questions and answers on the public site (capabilities A10 and F9). Answers are plain text carrying {live figure} names that lib/domain/faq.ts fills in from settings; no figure is stored.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. seed_faqs() — the FAQs every property starts with.
--
-- The questions the hand-written page answered in full, with every figure
-- turned into its `{name}`. Called twice and idempotent both times, the
-- construction seed_property_settings() (20260912000100) uses: at the foot of
-- this migration, which fills a database that already has a property, and from
-- supabase/seed.sql, which fills a freshly reset stack where the property does
-- not exist yet when migrations run. It seeds nothing for a property that
-- already has a FAQ, so it can never put back one that staff removed.
--
-- Read by lib/domain/faq.test.ts, which holds every row to the checks staff
-- are held to. Keep each row on the one-tuple shape that test parses:
-- ('topic', 'slug', 'question', E'answer', featured).
-- ═══════════════════════════════════════════════════════════════════════════

create function seed_faqs(p_property_id uuid)
returns void
language plpgsql
as $function$
begin
  if exists (select 1 from faq f where f.property_id = p_property_id) then
    return;
  end if;

  -- `row_number() over ()` numbers the VALUES in the order they are written,
  -- which is the order each topic reads in.
  insert into faq (property_id, topic, slug, question, answer, featured, sort_order)
  select
    p_property_id,
    spec.topic,
    spec.slug,
    spec.question,
    spec.answer,
    spec.featured,
    row_number() over (partition by spec.topic order by spec.position)
  from (
    select v.*, row_number() over () as position
    from (
      values
        ('day-passes', 'what-is-included-in-a-day-pass', 'What can we use with a day pass?', E'A day pass covers {day-pass facilities}.\nNot included: {facilities not in the day pass}. Call us if you would like to use any of those and we will work it out.', true),
        ('day-passes', 'day-pass-what-to-bring', 'What do we need to bring?', E'Your booking reference. Tell us your car registration when you book, or that you are not bringing a car — we record every vehicle that comes in.', false),
        ('staying', 'what-does-a-night-cost', 'What does a night cost?', E'{nightly rates}\nPick your dates on the booking page and you will see the full price, itemised, before you book anything.', true),
        ('staying', 'how-far-ahead-can-i-book', 'How far ahead can we book?', E'Up to {booking window} ahead.', false),
        ('staying', 'sofa-bed', 'Can we add a sofa bed?', E'{sofa bed charge} each, with a pillow and a blanket, subject to availability. Add it when you book and the price includes it.', false),
        ('staying', 'check-in-and-check-out', 'What time is check-in and check-out?', E'Check in from {check-in time}, and check out by {check-out time}.', true),
        ('staying', 'parking', 'Is there parking?', E'{parking spaces}\nGive us each car registration when you book, or tell us you are not bringing one. Security records every vehicle that comes in.', false),
        ('paying', 'how-do-i-pay', 'How do we pay?', E'Bank transfer to {bank accounts}, or cash on site.\nWe do not take cards yet.', true),
        ('paying', 'what-do-i-pay-when-i-book', 'What do we pay when we book?', E'The {security deposit} security deposit, which is what secures the booking. It is refundable, and the stay itself is settled when you arrive.\nIf you would rather send everything at once, you can choose that instead when you book.', true),
        ('paying', 'what-is-the-reference-for', 'What is the booking reference for?', E'Put it in the description of your transfer. It is how we match your money to your booking, and it is what you quote at the gate when you arrive.', false),
        ('paying', 'do-i-send-the-slip', 'Do we need to send you the transfer slip?', E'Keep it, but you do not need to send it. We check the bank ourselves — press "I have made the transfer" on your booking page and we will look for it.', false),
        ('paying', 'how-long-is-it-held', 'How long do you hold our booking?', E'Until we have confirmed your transfer. There is no countdown and nothing expires while you are waiting on us.', false),
        ('paying', 'how-do-i-know-it-is-confirmed', 'How do we know it is confirmed?', E'We confirm your booking once we have seen the transfer. Your booking page always shows where it has got to, and you can open it again at any time with your reference and the number you booked with.', false),
        ('changing-and-arriving', 'can-we-change-dates', 'Can we change our dates?', E'Call us. We can move a booking that has not started, and the price is worked out again for the new dates.', false),
        ('changing-and-arriving', 'what-to-bring', 'What do we need to bring on the day?', E'Your booking reference, and your IC — we take a copy when you arrive, for the guest register.', false),
        ('changing-and-arriving', 'what-happens-when-we-arrive', 'What happens when we arrive?', E'Quote your booking reference at the gate and security will check you in.', true),
        ('changing-and-arriving', 'find-my-booking', 'We have lost the link to our booking. What now?', E'Open it again with your booking reference and the phone number you booked with. It works whether you booked online or with us at the counter.', false),
        ('anything-else', 'long-term-rentals', 'Do you do long-term rentals?', E'Yes. Terms are agreed per tenancy — message us and we will talk it through.', false),
        ('anything-else', 'events', 'Can we hold an event, or use something a day pass does not cover?', E'Call us. Both are arranged case by case rather than sold online, so a conversation gets you a better answer than this page can.', false),
        ('anything-else', 'where-are-you', 'Where are you?', E'Lot 9163, Spg 84-92-52-33, Jln Setia Diraja, Kpg Mumong A, Mukim Kuala Belait, KA1531.\nThe map is under "Getting here" on our home page.', false)
    ) as v (topic, slug, question, answer, featured)
  ) as spec;
end;
$function$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. The writers.
--
-- The shape every writer in this schema has: lock, validate everything, then
-- write, returning a refusal as a VALUE rather than raising. One advisory lock
-- per property's FAQs, taken by all five, because two of the rules span rows —
-- no more than six featured, and one place per position in a topic — and a
-- property has a few dozen FAQs edited a few times a month, so nothing ever
-- waits on it long. Taken on nothing any other writer locks, so it adds no
-- lock order to reason about.
-- ═══════════════════════════════════════════════════════════════════════════

-- Question and answer tidied the way checkFaqDraft() tidies them, so a request
-- that did not come through it is held to the same text rules.
create function faq_tidy_question(p_question text)
returns text
language sql
immutable
as $function$
  select btrim(regexp_replace(coalesce(p_question, ''), '\s+', ' ', 'g'))
$function$;

create function faq_topic_is_valid(p_topic text)
returns boolean
language sql
immutable
as $function$
  select coalesce(
    p_topic in ('day-passes', 'staying', 'paying', 'changing-and-arriving', 'anything-else'),
    false
  )
$function$;

create function add_faq(
  p_property_id uuid,
  p_topic text,
  p_slug text,
  p_question text,
  p_answer text,
  p_featured boolean,
  p_actor_id uuid
)
returns jsonb
language plpgsql
as $function$
declare
  v_question text := faq_tidy_question(p_question);
  v_answer text := btrim(coalesce(p_answer, ''));
  v_featured boolean := coalesce(p_featured, false);
  v_slug text;
  v_suffix integer := 1;
  v_sort integer;
  v_id uuid;
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'error', 'actor_required');
  end if;

  if not faq_topic_is_valid(p_topic) then
    return jsonb_build_object('ok', false, 'error', 'topic_invalid');
  end if;

  if v_question = '' or char_length(v_question) > 200 then
    return jsonb_build_object('ok', false, 'error', 'question_invalid');
  end if;

  if v_answer = '' or char_length(v_answer) > 2000 then
    return jsonb_build_object('ok', false, 'error', 'answer_invalid');
  end if;

  if p_slug is null or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(p_slug) > 80 then
    return jsonb_build_object('ok', false, 'error', 'slug_invalid');
  end if;

  perform pg_advisory_xact_lock(hashtext(p_property_id::text || ':faq'));

  if v_featured and (
    select count(*) from faq f where f.property_id = p_property_id and f.featured
  ) >= 6 then
    return jsonb_build_object('ok', false, 'error', 'too_many_featured');
  end if;

  -- A second "How do we pay?" is a new address, not a clash: `-2`, `-3`, with
  -- the base shortened first so the result still fits the check.
  v_slug := p_slug;

  while exists (select 1 from faq f where f.property_id = p_property_id and f.slug = v_slug) loop
    v_suffix := v_suffix + 1;
    v_slug := rtrim(left(p_slug, 80 - char_length(v_suffix::text) - 1), '-') || '-' || v_suffix;
  end loop;

  select coalesce(max(f.sort_order), 0) + 1 into v_sort
  from faq f
  where f.property_id = p_property_id and f.topic = p_topic;

  insert into faq (
    property_id, slug, topic, question, answer, featured, sort_order, updated_by
  )
  values (
    p_property_id, v_slug, p_topic, v_question, v_answer, v_featured, v_sort, p_actor_id
  )
  returning id into v_id;

  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id, p_actor_id, 'faq.added', 'faq', v_id,
    null,
    jsonb_build_object(
      'name', v_question, 'topic', p_topic, 'answer', v_answer, 'featured', v_featured
    )
  );

  return jsonb_build_object('ok', true, 'id', v_id, 'slug', v_slug);
end;
$function$;

-- A question reworded, an answer rewritten, a topic changed, or the front-page
-- choice made from the editor.
--
-- `p_expected_updated_at` is the FAQ as the editor opened it. If it has moved
-- since, somebody else saved in the meantime and this would silently undo their
-- work, so it is refused as `stale`. Diffed by hand, with the question riding
-- on both sides as `name`, the construction update_site_image() uses. A save
-- that changed nothing writes nothing.
create function update_faq(
  p_property_id uuid,
  p_faq_id uuid,
  p_topic text,
  p_question text,
  p_answer text,
  p_featured boolean,
  p_expected_updated_at timestamptz,
  p_actor_id uuid
)
returns jsonb
language plpgsql
as $function$
declare
  v_faq faq%rowtype;
  v_question text := faq_tidy_question(p_question);
  v_answer text := btrim(coalesce(p_answer, ''));
  v_featured boolean := coalesce(p_featured, false);
  v_sort integer;
  v_before jsonb := '{}'::jsonb;
  v_after jsonb := '{}'::jsonb;
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'error', 'actor_required');
  end if;

  if not faq_topic_is_valid(p_topic) then
    return jsonb_build_object('ok', false, 'error', 'topic_invalid');
  end if;

  if v_question = '' or char_length(v_question) > 200 then
    return jsonb_build_object('ok', false, 'error', 'question_invalid');
  end if;

  if v_answer = '' or char_length(v_answer) > 2000 then
    return jsonb_build_object('ok', false, 'error', 'answer_invalid');
  end if;

  perform pg_advisory_xact_lock(hashtext(p_property_id::text || ':faq'));

  select * into v_faq
  from faq f
  where f.id = p_faq_id and f.property_id = p_property_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_faq.updated_at is distinct from p_expected_updated_at then
    return jsonb_build_object('ok', false, 'error', 'stale');
  end if;

  if v_featured and not v_faq.featured and (
    select count(*) from faq f where f.property_id = p_property_id and f.featured
  ) >= 6 then
    return jsonb_build_object('ok', false, 'error', 'too_many_featured');
  end if;

  if v_faq.topic is distinct from p_topic then
    v_before := v_before || jsonb_build_object('topic', v_faq.topic);
    v_after := v_after || jsonb_build_object('topic', p_topic);
  end if;

  if v_faq.question is distinct from v_question then
    v_before := v_before || jsonb_build_object('question', v_faq.question);
    v_after := v_after || jsonb_build_object('question', v_question);
  end if;

  if v_faq.answer is distinct from v_answer then
    v_before := v_before || jsonb_build_object('answer', v_faq.answer);
    v_after := v_after || jsonb_build_object('answer', v_answer);
  end if;

  if v_faq.featured is distinct from v_featured then
    v_before := v_before || jsonb_build_object('featured', v_faq.featured);
    v_after := v_after || jsonb_build_object('featured', v_featured);
  end if;

  if v_after = '{}'::jsonb then
    return jsonb_build_object('ok', true, 'changed', false);
  end if;

  -- A FAQ moved to another topic joins the end of it.
  v_sort := v_faq.sort_order;

  if v_faq.topic is distinct from p_topic then
    select coalesce(max(f.sort_order), 0) + 1 into v_sort
    from faq f
    where f.property_id = p_property_id and f.topic = p_topic;
  end if;

  update faq
  set topic = p_topic,
    question = v_question,
    answer = v_answer,
    featured = v_featured,
    sort_order = v_sort,
    updated_at = now(),
    updated_by = p_actor_id
  where id = p_faq_id;

  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id, p_actor_id, 'faq.updated', 'faq', p_faq_id,
    jsonb_build_object('name', v_faq.question) || v_before,
    jsonb_build_object('name', v_question) || v_after
  );

  return jsonb_build_object('ok', true, 'changed', true);
end;
$function$;

-- The front-page choice, made from the list rather than the editor. No stale
-- check: the choice is the whole of the write, so there is nothing of somebody
-- else's for it to undo.
create function set_faq_featured(
  p_property_id uuid,
  p_faq_id uuid,
  p_featured boolean,
  p_actor_id uuid
)
returns jsonb
language plpgsql
as $function$
declare
  v_faq faq%rowtype;
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'error', 'actor_required');
  end if;

  perform pg_advisory_xact_lock(hashtext(p_property_id::text || ':faq'));

  select * into v_faq
  from faq f
  where f.id = p_faq_id and f.property_id = p_property_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_faq.featured = coalesce(p_featured, false) then
    return jsonb_build_object('ok', true, 'changed', false);
  end if;

  if p_featured and (
    select count(*) from faq f where f.property_id = p_property_id and f.featured
  ) >= 6 then
    return jsonb_build_object('ok', false, 'error', 'too_many_featured');
  end if;

  update faq
  set featured = p_featured, updated_at = now(), updated_by = p_actor_id
  where id = p_faq_id;

  -- Two inserts rather than one with the verb in a `case`: the audit vocabulary
  -- test reads every (verb, entity) pair out of the migrations, and a verb
  -- inside a `case` is one it cannot see (lib/domain/audit-label.test.ts).
  if p_featured then
    insert into audit_event (
      property_id, actor_id, action, entity_type, entity_id, before, after
    )
    values (
      p_property_id, p_actor_id, 'faq.featured', 'faq', p_faq_id,
      jsonb_build_object('name', v_faq.question, 'featured', false),
      jsonb_build_object('name', v_faq.question, 'featured', true)
    );
  else
    insert into audit_event (
      property_id, actor_id, action, entity_type, entity_id, before, after
    )
    values (
      p_property_id, p_actor_id, 'faq.unfeatured', 'faq', p_faq_id,
      jsonb_build_object('name', v_faq.question, 'featured', true),
      jsonb_build_object('name', v_faq.question, 'featured', false)
    );
  end if;

  return jsonb_build_object('ok', true, 'changed', true);
end;
$function$;

-- One place up or down within its topic: a swap with the neighbour, which the
-- deferred unique constraint allows in one statement. The first FAQ moved up,
-- or the last moved down, changes nothing and records nothing.
--
-- Not an edit, so `updated_at` stays put: reordering the list must not make an
-- editor somebody has open refuse its save as stale.
create function move_faq(
  p_property_id uuid,
  p_faq_id uuid,
  p_direction text,
  p_actor_id uuid
)
returns jsonb
language plpgsql
as $function$
declare
  v_faq faq%rowtype;
  v_neighbour faq%rowtype;
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'error', 'actor_required');
  end if;

  if p_direction is null or p_direction not in ('up', 'down') then
    return jsonb_build_object('ok', false, 'error', 'direction_invalid');
  end if;

  perform pg_advisory_xact_lock(hashtext(p_property_id::text || ':faq'));

  select * into v_faq
  from faq f
  where f.id = p_faq_id and f.property_id = p_property_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if p_direction = 'up' then
    select * into v_neighbour
    from faq f
    where f.property_id = p_property_id
      and f.topic = v_faq.topic
      and f.sort_order < v_faq.sort_order
    order by f.sort_order desc
    limit 1
    for update;
  else
    select * into v_neighbour
    from faq f
    where f.property_id = p_property_id
      and f.topic = v_faq.topic
      and f.sort_order > v_faq.sort_order
    order by f.sort_order asc
    limit 1
    for update;
  end if;

  if v_neighbour.id is null then
    return jsonb_build_object('ok', true, 'changed', false);
  end if;

  update faq
  set sort_order = case id
    when v_faq.id then v_neighbour.sort_order
    else v_faq.sort_order
  end
  where id in (v_faq.id, v_neighbour.id);

  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id, p_actor_id, 'faq.moved', 'faq', p_faq_id,
    jsonb_build_object('name', v_faq.question),
    jsonb_build_object('name', v_faq.question, 'direction', p_direction)
  );

  return jsonb_build_object('ok', true, 'changed', true);
end;
$function$;

-- Takes a FAQ off the site. Deleted, with everything it said kept in the event.
create function remove_faq(
  p_property_id uuid,
  p_faq_id uuid,
  p_actor_id uuid
)
returns jsonb
language plpgsql
as $function$
declare
  v_faq faq%rowtype;
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'error', 'actor_required');
  end if;

  perform pg_advisory_xact_lock(hashtext(p_property_id::text || ':faq'));

  select * into v_faq
  from faq f
  where f.id = p_faq_id and f.property_id = p_property_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  delete from faq where id = p_faq_id;

  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id, p_actor_id, 'faq.removed', 'faq', p_faq_id,
    jsonb_build_object(
      'name', v_faq.question, 'slug', v_faq.slug, 'topic', v_faq.topic,
      'answer', v_faq.answer, 'featured', v_faq.featured
    ),
    jsonb_build_object('name', v_faq.question)
  );

  return jsonb_build_object('ok', true);
end;
$function$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. `faq.manage` — who may change what the site answers.
--
-- Its own string, for the reason `site_image.manage` has one (20260923000100):
-- whoever keeps the website's words current should not also be handed pricing,
-- roles and the audit log. Not `site_image.manage` either — a photograph and a
-- sentence about cancellations are different trusts, and the difference is one
-- tick in Roles & staff. Seeded to Admin only. Granted here as well as in
-- seed.sql because production moves by `db push`, which runs no seed.
-- ═══════════════════════════════════════════════════════════════════════════

alter table role_permission drop constraint role_permission_permission_check;

alter table role_permission add constraint role_permission_permission_check check (
  permission in (
    'booking.view', 'booking.create', 'booking.amend', 'booking.cancel',
    'booking.override_hold', 'booking.discount', 'booking.check_in', 'booking.check_out',
    'day_pass.admit', 'payment.verify', 'payment.record_cash', 'inspection.record',
    'charge.create', 'charge.waive', 'deposit.approve_release', 'deposit.waive',
    'unit.manage', 'tenancy.manage', 'config.manage', 'report.view',
    'document.view_identity', 'site_image.manage', 'faq.manage'
  )
);

insert into role_permission (property_id, role_id, permission)
select r.property_id, r.id, 'faq.manage'
from staff_role r
where r.slug = 'admin'
on conflict do nothing;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. The audit trail names a FAQ.
--
-- audit_event_summary as 20260923000100 defined it, with one branch added: the
-- question, read live so a reworded one shows its new wording. A removed FAQ
-- resolves to null, and the screen falls back to the `name` the event carries.
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
    else null
  end as subject_label
from audit_event e;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. Grants, and the FAQs every existing property starts with.
--
-- Service-role only, like every other writer: the data client is the only
-- caller, and authorisation happens above it in requirePermission().
-- ═══════════════════════════════════════════════════════════════════════════

revoke all on faq from public, anon, authenticated;
grant select, insert, update, delete on faq to service_role;

revoke all on audit_event_summary from public, anon, authenticated;
grant select on audit_event_summary to service_role;

revoke execute on function seed_faqs(uuid) from public, anon, authenticated;
revoke execute on function faq_tidy_question(text) from public, anon, authenticated;
revoke execute on function faq_topic_is_valid(text) from public, anon, authenticated;
revoke execute on function add_faq(uuid, text, text, text, text, boolean, uuid)
  from public, anon, authenticated;
revoke execute on function update_faq(uuid, uuid, text, text, text, boolean, timestamptz, uuid)
  from public, anon, authenticated;
revoke execute on function set_faq_featured(uuid, uuid, boolean, uuid)
  from public, anon, authenticated;
revoke execute on function move_faq(uuid, uuid, text, uuid) from public, anon, authenticated;
revoke execute on function remove_faq(uuid, uuid, uuid) from public, anon, authenticated;

grant execute on function seed_faqs(uuid) to service_role;
grant execute on function faq_tidy_question(text) to service_role;
grant execute on function faq_topic_is_valid(text) to service_role;
grant execute on function add_faq(uuid, text, text, text, text, boolean, uuid) to service_role;
grant execute on function update_faq(uuid, uuid, text, text, text, boolean, timestamptz, uuid)
  to service_role;
grant execute on function set_faq_featured(uuid, uuid, boolean, uuid) to service_role;
grant execute on function move_faq(uuid, uuid, text, uuid) to service_role;
grant execute on function remove_faq(uuid, uuid, uuid) to service_role;

-- A no-op on a fresh local stack, where migrations run before seed.sql and
-- there is no property yet; on every deployed database, the backfill.
select seed_faqs(id) from property;
