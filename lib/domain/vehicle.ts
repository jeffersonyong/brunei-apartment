/**
 * Vehicle registrations, normalised.
 *
 * prd.md §2 lists the vehicle registration among the things collected at
 * booking time, and §13 [C] makes it required "for records and security". §12.5
 * says why it has to be *searchable*: "vehicle registration lookup is a
 * first-class path, not a fallback" — a car arrives, the guard sees a plate,
 * and expects that lookup to carry more traffic than QR scanning.
 *
 * That last point is what makes normalisation a domain concern rather than a
 * form detail. A plate typed `baa 1234` at the desk and read `BAA1234` at the
 * gate is the same car, and the lookup is an equality match on an indexed
 * column (`booking_vehicle_property_registration_idx`). So the shape is decided
 * once, here, on the way in — never at the point of comparison, where a second
 * copy of these rules would drift from this one.
 *
 * What it deliberately does NOT do is validate a format. Brunei plates are not
 * one shape, and a pattern that refuses a legitimate plate at a front desk with
 * a guest standing at it is worse than a permissive field. The database agrees:
 * `booking_vehicle.registration` checks only that it is non-blank.
 */

/**
 * The longest plate accepted, matching `TextField`'s own limit.
 *
 * A bound on typing, not a rule about plates — nothing real is close to it.
 */
export const MAX_VEHICLE_REGISTRATION_LENGTH = 20

/**
 * How many vehicles one booking may list.
 *
 * **Not a parking rule.** prd.md §7.1 gives each unit type a `car_allowance`
 * (2 to 4) and open question R3 asks how many bays the property actually has;
 * neither is answered by refusing a plate. A family that arrives in three cars
 * for a two-car unit is a fact Security needs recorded, not a booking the
 * system should reject — the allowance is a charging and capacity question for
 * whoever answers R3. This is only a bound on the repeated field, so a stuck
 * key cannot write a thousand rows.
 *
 * The allowance is *shown* beside the rows — see `vehiclesBeyondParking` —
 * and on the public stay form it is also where the rows stop (Jason's team,
 * 19 September 2026). That limit is the allowance, enforced by the form and
 * the public action; this constant stays the bound on the field everywhere.
 */
export const MAX_VEHICLES_PER_BOOKING = 10

/**
 * How many of a booking's plates sit beyond the unit type's included spaces.
 *
 * The count, not a verdict: the caller decides what it means. prd.md §7.1's
 * `car_allowance` is what a unit *includes*. The desk's forms state it and let
 * the guest past it (Jeff, 17 September 2026) — staff have agreed the extra
 * car, and §12.5 makes plate lookup the guard's primary path, so a car whose
 * registration the form turned away is a car nobody can match at the gate.
 * The public stay form refuses past it instead, and sends the customer to the
 * office's WhatsApp to confirm another car first (Jason's team, 19 September
 * 2026).
 *
 * Blank rows do not count. A form always shows one empty row and grows by
 * empty rows, so counting them would warn about cars nobody has typed.
 * Duplicates do not count twice, because the same plate typed into two rows
 * is one car, and that is exactly what gets stored.
 *
 * Day passes never call this: a pass carries no unit and therefore no
 * allowance, and their visitor parking is the other half of R3.
 */
export function vehiclesBeyondParking(vehicles: readonly string[], spaces: number): number {
  return Math.max(0, normaliseVehicleRegistrations(vehicles).length - Math.max(0, spaces))
}

/**
 * One plate as it is stored: upper case, trimmed, internal runs of whitespace
 * collapsed to a single space. Blank comes back as `null`, because an empty
 * row in a repeated field is a row the staff member did not fill in, not a
 * vehicle with no name.
 */
export function normaliseVehicleRegistration(raw: string): string | null {
  const normalised = raw.trim().replace(/\s+/g, ' ').toUpperCase()

  return normalised.length > 0 ? normalised : null
}

/**
 * A booking's plates: normalised, blanks dropped, duplicates removed, order
 * kept.
 *
 * Order is the order they were given, which is the order they are shown in and
 * the order `booking_vehicle.sort_order` stores. De-duplication is not a
 * convenience — the table's `unique (property_id, booking_id, registration)`
 * would otherwise refuse the whole write because someone typed the same car
 * into two rows.
 */
export function normaliseVehicleRegistrations(raw: readonly string[]): readonly string[] {
  const seen = new Set<string>()

  for (const entry of raw) {
    const plate = normaliseVehicleRegistration(entry)

    if (plate) {
      seen.add(plate)
    }
  }

  return [...seen]
}

/**
 * Whether what the form collected is a legal answer to "which vehicles?".
 *
 * The two legal answers are "these ones" and "none, deliberately". The illegal
 * one is silence, which is what the field used to allow and what §13 [C] does
 * not. `create_walk_in_booking()` and `amend_booking()` refuse the same
 * combination, so this is the courtesy that turns a raised exception into a
 * message beside the field.
 */
export function hasVehicleAnswer(vehicles: readonly string[], noVehicle: boolean): boolean {
  return noVehicle || vehicles.length > 0
}

/** Plates as one line, for a table cell or a readout. */
export function formatVehicles(vehicles: readonly string[]): string | null {
  return vehicles.length > 0 ? vehicles.join(' · ') : null
}

/**
 * A plate reduced to its letters and digits, upper-cased — for comparing, and
 * never stored.
 *
 * The one departure from "decided once, on the way in" above, and it is
 * forced by where the typing happens. A guard at the barrier types what they
 * read off a moving car on a phone keyboard: `baa1234`, `BAA 1234`,
 * `baa-1234`. The stored plate keeps the desk's spacing because that is what
 * a person wrote down; the gate compares both sides through this, exactly as
 * `normalisePhoneForMatch` does for phone numbers (architecture.md §5.1).
 * `gate_booking_search()` applies the same rule in SQL.
 */
export function plateKey(raw: string): string {
  return raw.toUpperCase().replace(/[^0-9A-Z]/g, '')
}
