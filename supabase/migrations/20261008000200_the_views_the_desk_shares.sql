-- Saved views on All bookings, shared by the team, and a "Money owed" filter
-- (capability B19, Jason's team, 8 October 2026; open-questions.md N60).
--
-- Jason wants a list he can keep open that leaves out the bookings nobody has
-- to chase — "everything but confirmed and completed" — and wants it to be
-- there for the whole team, not only in his own browser's bookmarks. The
-- filters were always URL state, so a view is a named set of them, kept in the
-- property's own table.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- 1. What a booking still owes, on the read model.
--
-- A deposit-only stay is *confirmed* and still owes the whole stay until the
-- guest arrives, so a status filter cannot find "the bookings that owe us
-- money" — and those are exactly the ones a view leaving out Confirmed would
-- otherwise hide. `total_cents - paid_cents` is the figure lib/domain/balance.ts
-- already calls outstanding (verified payments only; a promised transfer counts
-- for nothing until somebody checks the bank; the security deposit is not part
-- of it). PostgREST cannot compare two columns, so the subtraction is made here
-- once and filtered on as a column.
--
-- Appended, because `create or replace view` takes a new column only at the
-- end. Everything before it is 20261008000100's definition, unchanged.
-- ═══════════════════════════════════════════════════════════════════════════

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
  b.access_token,
  (b.total_cents - coalesce(pay.paid_cents, 0))::integer as outstanding_cents
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

revoke all on booking_summary from public, anon, authenticated;
grant select on booking_summary to service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. The views themselves.
--
-- **Shared by everyone who can see the list, and anyone may save or delete
-- one** (Jeff, 8 October 2026). A view is a bookmark the team keeps together.
--
-- **There is no date column, so a view cannot carry dates.** "1–7 October"
-- saved as a view is useless by the 8th; a view is the kind of bookings, and
-- the dates are chosen each time.
--
-- **Statuses and streams are not checked against a list here.** They are
-- validated when they are read (lib/domain/booking-list-view.ts), so a status
-- the state machine one day retires drops out of every view that named it
-- rather than needing a data migration — or worse, making the bookings page
-- fail to render.
--
-- **Not audited** (architecture.md §4). A view approves nothing, moves no money
-- and holds no personal data — the precedent is `booking_note`'s. Who saved it
-- and when is on the row; who deleted one is not recorded anywhere, which is
-- the cost of that choice.
-- ═══════════════════════════════════════════════════════════════════════════

create table booking_list_view (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references property (id) on delete cascade,
  name text not null
    check (name = btrim(name) and char_length(name) between 1 and 40),
  statuses text[] not null default '{}' check (cardinality(statuses) <= 20),
  streams text[] not null default '{}' check (cardinality(streams) <= 10),
  search text
    check (search is null or (search = btrim(search) and char_length(search) between 1 and 100)),
  money_owed boolean not null default false,
  -- A view outlives whoever saved it; deleting a staff account must not be
  -- refused because they once named a filter.
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),

  -- A view that filters nothing is "All bookings", which is always there.
  constraint booking_list_view_filters_something check (
    cardinality(statuses) > 0 or cardinality(streams) > 0 or search is not null or money_owed
  )
);

-- Two views called "Unpaid" and "unpaid" are one name to the person picking
-- between them.
create unique index booking_list_view_name_idx on booking_list_view (property_id, lower(name));

alter table booking_list_view enable row level security;

comment on table booking_list_view is
  'Named sets of All-bookings filters the team shares (capability B19). Never dates. See lib/domain/booking-list-view.ts.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Saving one.
--
-- A function rather than a plain insert for the two rules that need the other
-- rows: at most twelve views (a row of chips is a menu, not a filing cabinet),
-- and no two with the same filters under different names, which would be one
-- view the team has to keep in step twice. Under a per-property lock so two
-- people saving at once cannot both slip under either rule.
-- ═══════════════════════════════════════════════════════════════════════════

create function save_booking_list_view(
  p_property_id uuid,
  p_name text,
  p_statuses text[],
  p_streams text[],
  p_search text,
  p_money_owed boolean,
  p_actor_id uuid
)
returns jsonb
language plpgsql
as $function$
declare
  v_name text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_statuses text[] := coalesce(
    (select array_agg(distinct s order by s) from unnest(p_statuses) s where s is not null),
    '{}'
  );
  v_streams text[] := coalesce(
    (select array_agg(distinct s order by s) from unnest(p_streams) s where s is not null),
    '{}'
  );
  v_search text := nullif(btrim(coalesce(p_search, '')), '');
  v_money_owed boolean := coalesce(p_money_owed, false);
  v_same text;
  v_id uuid;
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'error', 'actor_required');
  end if;

  if v_name = '' then
    return jsonb_build_object('ok', false, 'error', 'name_required');
  end if;

  if char_length(v_name) > 40 then
    return jsonb_build_object('ok', false, 'error', 'name_too_long');
  end if;

  if v_search is not null and char_length(v_search) > 100 then
    return jsonb_build_object('ok', false, 'error', 'search_too_long');
  end if;

  if cardinality(v_statuses) = 0 and cardinality(v_streams) = 0
    and v_search is null and not v_money_owed
  then
    return jsonb_build_object('ok', false, 'error', 'nothing_to_save');
  end if;

  perform pg_advisory_xact_lock(hashtext(p_property_id::text || ':booking_list_view'));

  if exists (
    select 1 from booking_list_view v
    where v.property_id = p_property_id and lower(v.name) = lower(v_name)
  ) then
    return jsonb_build_object('ok', false, 'error', 'name_taken');
  end if;

  -- Compared as sets: the order a filter was chosen in is not part of it.
  select v.name into v_same
  from booking_list_view v
  where v.property_id = p_property_id
    and coalesce((select array_agg(distinct s order by s) from unnest(v.statuses) s), '{}') = v_statuses
    and coalesce((select array_agg(distinct s order by s) from unnest(v.streams) s), '{}') = v_streams
    and lower(coalesce(v.search, '')) = lower(coalesce(v_search, ''))
    and v.money_owed = v_money_owed
  limit 1;

  if v_same is not null then
    return jsonb_build_object('ok', false, 'error', 'duplicate', 'name', v_same);
  end if;

  if (select count(*) from booking_list_view v where v.property_id = p_property_id) >= 12 then
    return jsonb_build_object('ok', false, 'error', 'too_many');
  end if;

  insert into booking_list_view (
    property_id, name, statuses, streams, search, money_owed, created_by
  )
  values (
    p_property_id, v_name, v_statuses, v_streams, v_search, v_money_owed, p_actor_id
  )
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id);

exception
  -- The lock makes this unreachable between two saves; kept so a racing
  -- insert from anywhere else still reads as a sentence.
  when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'name_taken');
end;
$function$;

revoke all on booking_list_view from public, anon, authenticated;
grant select, insert, delete on booking_list_view to service_role;

revoke execute on function save_booking_list_view(uuid, text, text[], text[], text, boolean, uuid)
  from public, anon, authenticated;
grant execute on function save_booking_list_view(uuid, text, text[], text[], text, boolean, uuid)
  to service_role;
