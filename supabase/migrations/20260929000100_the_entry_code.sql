-- ═══════════════════════════════════════════════════════════════════════════
-- The entry code (capability A8's QR half, D3's scan; prd.md §12,
-- architecture.md §7).
--
-- A confirmed booking carries a QR code that opens `/c/{token}` on the staff
-- host. The code grants nothing by itself — a guard's session decides what the
-- page lets him do — so the token only has to be unguessable, replaceable and
-- never the booking's id or reference.
--
-- ── Issued by the database, at confirmation ───────────────────────────────
--
-- prd.md §10.1 step 6: "Booking becomes `confirmed`. QR is issued." Seven
-- paths confirm a booking today — the payments queue twice, the booking
-- screen three times, the desk's cash screen, the gate's cash, and a walk-in
-- created already paid — and the next one somebody writes would be the eighth
-- to remember. So the rule is a trigger, the way `booking_status_syncs_
-- occupancy` keeps the occupancy in step: the first time a row reaches
-- `confirmed` (or `checked_in`, which a booking cannot skip to today but costs
-- nothing to cover), it gets a token in the same write. A later move never
-- replaces it; a cancelled booking keeps its token, and the page it opens says
-- the booking is closed.
--
-- **16 random bytes, base64url, 22 characters** — `booking.access_token`'s
-- shape, from pgcrypto rather than node:crypto because the database is the
-- writer. 128 bits: nothing about the page behind it needs a counter.
--
-- **Issuing it writes no trail entry.** The confirmation is already on the
-- trail with whoever made it, and every confirmed booking has a code by
-- construction, so a row per booking would record a fact the status already
-- states — and, written from a before-trigger, it would sit ahead of the
-- booking's own creation event in a trail that is read in order. Replacing a
-- code is a person's act, and is recorded.
--
-- ── Replaced, never merely revoked ────────────────────────────────────────
--
-- A leaked or forwarded code is answered by `reissue_booking_qr_token()`,
-- which writes a new token — the old URL stops resolving in the same
-- statement — and records who did it, without the token: a live credential
-- does not belong in a second, append-only place (`issue_booking_access_
-- token()`'s reason). There is no revoke that leaves a confirmed booking
-- without a code: every screen would then need a third state for a booking
-- the gate still expects.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. The column ----------------------------------------------------------------

alter table booking add column qr_token text;

alter table booking add constraint booking_qr_token_shape check (
  qr_token is null or qr_token ~ '^[A-Za-z0-9_-]{22}$'
);

create unique index booking_qr_token_idx
  on booking (qr_token)
  where qr_token is not null;

comment on column booking.qr_token is
  'The entry QR code''s token: /c/{token} on the staff host. Issued by trigger when the booking is first confirmed; replaced by reissue_booking_qr_token(). Grants nothing without a staff session (architecture.md §7).';

-- 2. The token -----------------------------------------------------------------

create function new_entry_token() returns text
language sql
volatile
set search_path = public
as $function$
  select rtrim(translate(encode(extensions.gen_random_bytes(16), 'base64'), '+/', '-_'), '=');
$function$;

revoke execute on function new_entry_token() from public, anon, authenticated;

-- 3. Issued at confirmation ----------------------------------------------------

create function issue_entry_token_on_confirmation() returns trigger
language plpgsql
set search_path = public
as $function$
declare
  v_token text;
begin
  if new.qr_token is null and new.status in ('confirmed', 'checked_in') then
    -- Drawn again until unused. The unique index is checked after this
    -- function returns, where no handler here could catch it, and a collision
    -- would abort the write that confirmed the booking — a verified payment,
    -- say. At 128 bits the loop runs once; the lookup is on the index.
    loop
      v_token := new_entry_token();
      exit when not exists (select 1 from booking where qr_token = v_token);
    end loop;

    new.qr_token := v_token;
  end if;

  return new;
end;
$function$;

create trigger booking_issues_entry_token
  before insert or update of status on booking
  for each row
  execute function issue_entry_token_on_confirmation();

-- 4. The bookings already confirmed --------------------------------------------
--
-- Their confirmation happened before the trigger existed. Given a code now, so
-- the gate, the emails and the booking screen treat every live booking alike.

update booking
   set qr_token = new_entry_token()
 where qr_token is null
   and status in ('confirmed', 'checked_in');

-- 5. Replacing a code ----------------------------------------------------------

create function reissue_booking_qr_token(
  p_property_id uuid,
  p_booking_id  uuid,
  p_actor_id    uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_status   text;
  v_existing text;
  v_token    text;
begin
  select status, qr_token
    into v_status, v_existing
    from booking
   where property_id = p_property_id
     and id = p_booking_id
     for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  -- Only a code somebody can still use is worth replacing. A closed booking's
  -- page already says it is closed, and a new code for it would be a second
  -- credential for nothing.
  if v_status not in ('confirmed', 'checked_in') then
    return jsonb_build_object(
      'ok', false,
      'error', case when v_existing is null then 'not_confirmed' else 'booking_closed' end
    );
  end if;

  v_token := new_entry_token();

  update booking
     set qr_token = v_token
   where property_id = p_property_id
     and id = p_booking_id;

  insert into audit_event (
    property_id, actor_id, action, entity_type, entity_id, before, after
  )
  values (
    p_property_id, p_actor_id, 'booking.qr_reissued', 'booking', p_booking_id, null,
    jsonb_build_object('reissued', true)
  );

  return jsonb_build_object('ok', true, 'qr_token', v_token);

exception
  when unique_violation then
    -- 128 bits colliding means the generator is broken; the caller tries once
    -- more and then says so, as issue_booking_access_token()'s caller does.
    return jsonb_build_object('ok', false, 'error', 'token_collision');
end;
$function$;

revoke execute on function reissue_booking_qr_token(uuid, uuid, uuid)
  from public, anon, authenticated;

grant execute on function reissue_booking_qr_token(uuid, uuid, uuid) to service_role;
