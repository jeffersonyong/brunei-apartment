-- ═══════════════════════════════════════════════════════════════════════════
-- How far each member of staff has read their notifications.
--
-- The portal's bell lists a few events somebody at the desk should hear about
-- without going to look: a booking made on the website, a payment waiting to
-- be checked, a booking email that failed (lib/domain/notifications.ts).
--
-- ── The notifications themselves are not stored ───────────────────────────
--
-- Every one of them is already an `audit_event` row, append-only and scoped to
-- the property (20260829000300). A table of notifications would be a second
-- copy of those facts, written by a second path that could miss one. So the
-- bell reads the trail, and the only thing this migration adds is the one
-- fact the trail cannot hold: when each person last opened the bell.
--
-- One timestamp per person rather than a row per notification read: opening
-- the bell marks everything it shows seen, which is how the bell behaves, and a
-- per-item table would grow with the trail for a distinction nobody uses.
--
-- ── No index on the trail ─────────────────────────────────────────────────
--
-- The bell asks for three verbs over the last fortnight, newest first, and
-- `audit_event_property_at_idx` already answers that scan: at this property's
-- volume a fortnight is a few hundred rows. 20260912000200 names the index to
-- add — (property_id, action, at desc) — the day it is measured slow.
-- ═══════════════════════════════════════════════════════════════════════════

create table notification_read (
  property_id uuid not null references property (id) on delete cascade,
  -- A deleted account's reading position means nothing, so it goes with it.
  user_id uuid not null references auth.users (id) on delete cascade,
  seen_at timestamptz not null default now(),

  primary key (property_id, user_id)
);

-- Enabled with no policies, like every table since 20260829000800: it is read
-- and written through lib/db, never by a browser.
alter table notification_read enable row level security;

comment on table notification_read is
  'When each member of staff last opened the portal''s notifications. The notifications themselves are audit events; see lib/domain/notifications.ts.';

-- Seen up to the newest notification the reader was shown, not up to now: an
-- event that landed between the bell's last read and the click was never on
-- screen, and must still arrive as new. The caller's time is clamped to the
-- database's clock, and the position never moves backwards, so two open tabs
-- cannot unread each other.
create function mark_notifications_seen(
  p_property_id uuid,
  p_user_id uuid,
  p_seen_at timestamptz
)
returns timestamptz
language sql
as $function$
  insert into notification_read (property_id, user_id, seen_at)
  values (p_property_id, p_user_id, least(p_seen_at, now()))
  on conflict (property_id, user_id) do update
    set seen_at = greatest(notification_read.seen_at, excluded.seen_at)
  returning seen_at;
$function$;

revoke all on notification_read from public, anon, authenticated;
grant select, insert, update, delete on notification_read to service_role;

revoke execute on function mark_notifications_seen(uuid, uuid, timestamptz) from public, anon, authenticated;
grant execute on function mark_notifications_seen(uuid, uuid, timestamptz) to service_role;
