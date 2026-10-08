-- A booking made online arrives with the guest's IC or passport, or is not
-- made (capability A7, Jason's team, 8 October 2026; open-questions.md N62).
--
-- Until now the ID was an optional upload on the guest's own page, after they
-- had told us they transferred. Jason wants it compulsory, on both public
-- forms — a stay and a day pass — and the front of an IC or a passport will
-- do. Bookings the desk makes stay as they are: the guest is standing there,
-- and the ID can be filed afterwards.
--
-- ── One transaction for the booking and its ID ────────────────────────────
--
-- The file goes to Storage first (lib/db/documents.ts `stageDocument`), as
-- every upload does, because the row's key has to exist before the bytes can
-- be sent. These wrappers then create the booking and record the document in
-- one statement: the existing creator, then `attach_document()`. If the
-- document is refused — a retention period somebody deleted, a file the
-- checks turn down — the inner block raises, and Postgres rolls back the
-- guest, the booking, its lines, its occupancy and the `booking.created_public`
-- event the staff bell would have rung on. **A booking never exists without its
-- ID, and an ID never exists without its booking.** The object left in Storage
-- is discarded by the caller, and by the nightly sweep if that fails.
--
-- The creators are untouched, so desk-side and test callers keep them, and the
-- retention clock comes out right with no change: a stay's ID is kept from
-- its check-out date, which the occupancy row has by the time
-- `attach_document()` reads it in the same transaction.
--
-- The kind, the bucket and "uploaded by the customer" are fixed here rather
-- than passed: these two functions exist for one document, from one person.

create function create_public_stay_booking_with_identity(
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
  p_max_open_per_phone integer,
  p_identity_document_id uuid,
  p_identity_storage_key text,
  p_identity_filename text,
  p_identity_mime_type text,
  p_identity_byte_size integer
)
returns jsonb
language plpgsql
as $function$
declare
  v_created jsonb;
  v_attached jsonb;
begin
  begin
    v_created := create_public_stay_booking(
      p_property_id, p_unit_type_slug, p_status, p_check_in, p_check_out,
      p_guest_name, p_guest_phone, p_guest_email, p_vehicles, p_no_vehicle,
      p_chargeable_guests, p_exempt_guests, p_total_cents, p_security_deposit_cents,
      p_lines, p_access_token, p_max_open_per_phone
    );

    -- A refusal wrote nothing (the creator rolls itself back), so there is
    -- nothing to attach to and nothing to undo.
    if not coalesce((v_created ->> 'ok')::boolean, false) then
      return v_created;
    end if;

    v_attached := attach_document(
      p_property_id, p_identity_document_id, 'identity',
      (v_created ->> 'booking_id')::uuid, null, null,
      'identity-docs', p_identity_storage_key, p_identity_filename,
      p_identity_mime_type, p_identity_byte_size,
      null, null, null, true
    );

    if not coalesce((v_attached ->> 'ok')::boolean, false) then
      raise exception using
        errcode = 'PV005',
        message = coalesce(v_attached ->> 'error', 'unknown');
    end if;
  exception
    when sqlstate 'PV005' then
      return jsonb_build_object('ok', false, 'error', 'identity_refused', 'reason', sqlerrm);
  end;

  return v_created || jsonb_build_object('identity_document_id', p_identity_document_id);
end;
$function$;

create function create_public_day_pass_booking_with_identity(
  p_property_id uuid,
  p_status text,
  p_pass_date date,
  p_party jsonb,
  p_headcount integer,
  p_chargeable_guests integer,
  p_exempt_guests integer,
  p_guest_name text,
  p_guest_phone text,
  p_guest_email text,
  p_vehicles text[],
  p_no_vehicle boolean,
  p_total_cents integer,
  p_lines jsonb,
  p_access_token text,
  p_max_open_per_phone integer,
  p_identity_document_id uuid,
  p_identity_storage_key text,
  p_identity_filename text,
  p_identity_mime_type text,
  p_identity_byte_size integer
)
returns jsonb
language plpgsql
as $function$
declare
  v_created jsonb;
  v_attached jsonb;
begin
  begin
    v_created := create_public_day_pass_booking(
      p_property_id, p_status, p_pass_date, p_party, p_headcount,
      p_chargeable_guests, p_exempt_guests, p_guest_name, p_guest_phone, p_guest_email,
      p_vehicles, p_no_vehicle, p_total_cents, p_lines, p_access_token, p_max_open_per_phone
    );

    if not coalesce((v_created ->> 'ok')::boolean, false) then
      return v_created;
    end if;

    v_attached := attach_document(
      p_property_id, p_identity_document_id, 'identity',
      (v_created ->> 'booking_id')::uuid, null, null,
      'identity-docs', p_identity_storage_key, p_identity_filename,
      p_identity_mime_type, p_identity_byte_size,
      null, null, null, true
    );

    if not coalesce((v_attached ->> 'ok')::boolean, false) then
      raise exception using
        errcode = 'PV005',
        message = coalesce(v_attached ->> 'error', 'unknown');
    end if;
  exception
    when sqlstate 'PV005' then
      return jsonb_build_object('ok', false, 'error', 'identity_refused', 'reason', sqlerrm);
  end;

  return v_created || jsonb_build_object('identity_document_id', p_identity_document_id);
end;
$function$;

revoke execute on function create_public_stay_booking_with_identity(
  uuid, text, text, date, date, text, text, text, text[], boolean, integer, integer,
  integer, integer, jsonb, text, integer, uuid, text, text, text, integer
) from public, anon, authenticated;
grant execute on function create_public_stay_booking_with_identity(
  uuid, text, text, date, date, text, text, text, text[], boolean, integer, integer,
  integer, integer, jsonb, text, integer, uuid, text, text, text, integer
) to service_role;

revoke execute on function create_public_day_pass_booking_with_identity(
  uuid, text, date, jsonb, integer, integer, integer, text, text, text, text[], boolean,
  integer, jsonb, text, integer, uuid, text, text, text, integer
) from public, anon, authenticated;
grant execute on function create_public_day_pass_booking_with_identity(
  uuid, text, date, jsonb, integer, integer, integer, text, text, text, text[], boolean,
  integer, jsonb, text, integer, uuid, text, text, text, integer
) to service_role;
