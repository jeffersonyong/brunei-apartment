-- The party counted at the gate, and changed by the office (Jason's team,
-- 19 September 2026).
--
-- Guests arrive with more people than they booked — sometimes to avoid the
-- extra-person charge — or with fewer. Nothing let anybody say so: the guard
-- could not tell the office, and the office could change a party only through
-- the amendment screen, which refuses a guest already checked in (prd.md §9.6,
-- N12) and has no path for a day pass at all.
--
-- Two functions:
--
--   change_booking_party()   the party, repriced, on a stay or a pass that is
--                            still open — checked in included. The office's,
--                            under booking.amend; and the gate's for a pass,
--                            where the guard adds the visitors he counted and
--                            takes the difference in cash.
--   report_extra_guests()    the guard's word to the office: a note on the
--                            booking and an event the office's bell reads.
--
-- **Only the party's lines move.** TypeScript prices the change
-- (lib/domain/pricing/party-change.ts for a stay, priceDayPass for a pass) and
-- hands the whole line set over, exactly as amend_booking() takes one; this
-- replaces the lines wholesale, because the lines are the price (prd.md §8).
-- The status does not move and no money does: what the change leaves owing,
-- or owed back, is the balance, which every screen already derives.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. change_booking_party
--
-- **A pass that grows is a capacity question**, asked the way the pass was
-- sold: under the same per-date advisory lock create_public_day_pass_booking()
-- takes, so two passes growing into the last places on one day cannot both
-- read "room for two". `day_pass_headroom` already counts this pass, so the
-- question is whether the *difference* fits. A pass that shrinks, or keeps its
-- size, asks nothing.
--
-- **A closed booking is refused.** It takes no more payments (the money
-- functions refuse it), so a party changed on one would leave a balance
-- nobody can record against. A stay that ended with people unaccounted for is
-- settled from the deposit, which is the office's existing path.
-- ═══════════════════════════════════════════════════════════════════════════

create function change_booking_party(
  p_property_id uuid,
  p_booking_id uuid,
  p_expected_updated_at timestamptz,
  p_chargeable_guests integer,
  p_exempt_guests integer,
  p_total_cents integer,
  p_lines jsonb,
  p_pass_party jsonb default null,
  p_pass_headcount integer default null,
  p_reason text default null,
  p_actor_id uuid default null
)
returns jsonb
language plpgsql
as $function$
declare
  v_booking booking%rowtype;
  v_pass day_pass%rowtype;
  v_is_pass boolean;
  v_capacity integer;
  v_taken integer;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_before jsonb;
  v_after jsonb;
begin
  select * into v_booking
  from booking
  where id = p_booking_id and property_id = p_property_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_booking.updated_at is distinct from p_expected_updated_at then
    return jsonb_build_object('ok', false, 'error', 'changed');
  end if;

  if v_booking.status in ('completed', 'cancelled', 'expired', 'no_show') then
    return jsonb_build_object('ok', false, 'error', 'booking_closed');
  end if;

  v_is_pass := v_booking.stream = 'day_pass';

  -- The caller's shape has to match the booking's. Raised, not returned: a
  -- stay handed a pass party is a programming error, not a refusal to word.
  if v_is_pass <> (p_pass_party is not null and p_pass_headcount is not null) then
    raise exception 'change_booking_party: a day pass takes a party and a headcount, a stay neither (%)',
      p_booking_id;
  end if;

  v_before := jsonb_build_object(
    'chargeable_guests', v_booking.chargeable_guests,
    'exempt_guests', v_booking.exempt_guests,
    'total_cents', v_booking.total_cents
  );

  v_after := jsonb_build_object(
    'chargeable_guests', p_chargeable_guests,
    'exempt_guests', p_exempt_guests,
    'total_cents', p_total_cents
  );

  if v_is_pass then
    select * into v_pass
    from day_pass
    where booking_id = p_booking_id and property_id = p_property_id
    for update;

    if not found then
      return jsonb_build_object('ok', false, 'error', 'not_found');
    end if;

    if p_pass_headcount > v_pass.headcount then
      perform pg_advisory_xact_lock(hashtext(p_property_id::text || ':' || v_pass.pass_date::text));

      select h.capacity, h.taken
      into v_capacity, v_taken
      from day_pass_headroom(p_property_id, v_pass.pass_date, v_pass.pass_date) h;

      if v_capacity is not null
         and v_taken - v_pass.headcount + p_pass_headcount > v_capacity then
        return jsonb_build_object(
          'ok', false,
          'error', 'capacity_exceeded',
          'remaining', greatest(v_capacity - (v_taken - v_pass.headcount), 0)
        );
      end if;
    end if;

    update day_pass
    set party = p_pass_party,
        headcount = p_pass_headcount
    where booking_id = p_booking_id and property_id = p_property_id;

    v_before := v_before || jsonb_build_object('headcount', v_pass.headcount, 'party', v_pass.party);
    v_after := v_after || jsonb_build_object('headcount', p_pass_headcount, 'party', p_pass_party);
  end if;

  update booking
  set chargeable_guests = p_chargeable_guests,
      exempt_guests = p_exempt_guests,
      total_cents = p_total_cents
  where id = p_booking_id and property_id = p_property_id;

  -- The same wholesale replacement amend_booking() makes, and the same column
  -- list — `extra_id` included, or an extra's line arrives naming nothing.
  delete from booking_line
  where booking_id = p_booking_id and property_id = p_property_id;

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

  if v_reason is not null then
    v_after := v_after || jsonb_build_object('reason', v_reason);
  end if;

  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id, p_actor_id, 'booking.party_changed', 'booking', p_booking_id, v_before, v_after
  );

  return jsonb_build_object('ok', true);
end;
$function$;

comment on function change_booking_party(
  uuid, uuid, timestamptz, integer, integer, integer, jsonb, jsonb, integer, text, uuid
) is
  'Changes how many people an open booking is for — a stay, checked in or not, or a day pass — replacing its lines with the set TypeScript priced. A growing pass is checked against the day''s capacity under the per-date lock. Moves no money and no status; the balance says what is owed either way.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. report_extra_guests
--
-- The guard counted more people than the booking is for. What he says becomes
-- a note on the booking — where the office reads everything else about a stay
-- — and an event, which is how the office's bell hears about it
-- (lib/domain/notifications.ts reads the audit trail rather than a copy).
-- One transaction, so there is never a note the bell missed or a bell with no
-- note behind it.
--
-- `p_added_cents` is set when the guard also added the visitors to a pass and
-- took the difference: the note says so, and the office has nothing to do but
-- know.
-- ═══════════════════════════════════════════════════════════════════════════

create function report_extra_guests(
  p_property_id uuid,
  p_booking_id uuid,
  p_extra integer,
  p_body text,
  p_added_cents integer default null,
  p_actor_id uuid default null
)
returns jsonb
language plpgsql
as $function$
declare
  v_booking booking%rowtype;
  v_note_id uuid;
begin
  if p_extra is null or p_extra < 1 then
    raise exception 'report_extra_guests: at least one extra guest (%)', p_booking_id;
  end if;

  select * into v_booking
  from booking
  where id = p_booking_id and property_id = p_property_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  insert into booking_note (property_id, booking_id, audience, body, author_id)
  values (p_property_id, p_booking_id, 'internal', btrim(p_body), p_actor_id)
  returning id into v_note_id;

  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id, p_actor_id, 'booking.extra_guests_reported', 'booking', p_booking_id,
    null,
    jsonb_build_object(
      'reference', v_booking.reference,
      'stream', v_booking.stream,
      'extra', p_extra,
      'added_cents', p_added_cents,
      'note_id', v_note_id
    )
  );

  return jsonb_build_object('ok', true, 'note_id', v_note_id);
end;
$function$;

comment on function report_extra_guests(uuid, uuid, integer, text, integer, uuid) is
  'The guard''s report of more people at the gate than a booking is for: an internal note on the booking and a booking.extra_guests_reported event the office''s notifications read, in one transaction.';

revoke execute on function change_booking_party(
  uuid, uuid, timestamptz, integer, integer, integer, jsonb, jsonb, integer, text, uuid
) from public, anon, authenticated;
revoke execute on function report_extra_guests(uuid, uuid, integer, text, integer, uuid)
  from public, anon, authenticated;

grant execute on function change_booking_party(
  uuid, uuid, timestamptz, integer, integer, integer, jsonb, jsonb, integer, text, uuid
) to service_role;
grant execute on function report_extra_guests(uuid, uuid, integer, text, integer, uuid)
  to service_role;
