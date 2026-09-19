'use client'

import { Plus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Notice } from '@/components/ui/notice'
import {
  MAX_VEHICLES_PER_BOOKING,
  MAX_VEHICLE_REGISTRATION_LENGTH,
  vehiclesBeyondParking,
} from '@/lib/domain/vehicle'
import { cn } from '@/lib/utils'

/**
 * The vehicles arriving on a booking — one row per car, plus the exception.
 *
 * prd.md §2 lists the vehicle registration among what is collected, and §13 [C]
 * makes it **required** "for records and security". The field was optional and
 * singular, which understated the requirement twice over: a booking could carry
 * no plate at all, and a family arriving in three cars had two of them nowhere.
 * §12.5 is what makes the second one bite — "vehicle registration lookup is a
 * first-class path, not a fallback" — so a car whose plate never reached the
 * system is a car the guard cannot match to a booking at the gate.
 *
 * ── Why a checkbox rather than simply allowing blank ───────────────────────
 *
 * Some guests genuinely arrive without a car, and the form has to accept that.
 * But "no vehicle" and "nobody asked" look identical when both are an empty
 * field, and only one of them is a fact. So the exception is a thing you say
 * out loud: checking it is an assertion, stored as `booking.no_vehicle` and
 * shown on the booking as "None" rather than "Not recorded".
 *
 * It is deliberately the quiet half of this section — a checkbox under the
 * rows, not a choice offered before them — because the ordinary answer is a
 * plate and the form should ask for that first.
 *
 * ── The rows ───────────────────────────────────────────────────────────────
 *
 * Every row is an `<input name="vehicles">`, so `FormData.getAll('vehicles')`
 * hands the action the whole set with no index parsing and no JSON. Normalising
 * and de-duplicating is the action's job through `normaliseVehicleRegistrations`
 * — doing it here as the staff member types would fight the cursor.
 *
 * Rows are held by the parent form rather than here. Both forms already own
 * every other field's state, the amendment form diffs its draft against what
 * the server holds, and a component that kept a private copy would be a second
 * source of truth for one field.
 *
 * ── Why it is not in components/portal ────────────────────────────────────
 *
 * It was, until the public booking forms needed the same control (capabilities
 * A1–A4). A customer arriving in two cars is the same fact as a guest at the
 * desk arriving in two cars, and §12.5 makes the plate the guard's primary
 * lookup either way — so a second, single-field version on the public site
 * would have been a booking the guard could not match at the gate. Every value
 * here is a theme role, so it takes the lagoon accent on the customer surface
 * and stays monochrome on the operations one without knowing which it is in.
 *
 * The only thing that differs is the sentence under the exception, which the
 * caller passes: the desk needs to be told why the box matters, and a customer
 * needs to be told what it means.
 *
 * ── The parking allowance: stated at the desk, a limit for a customer ──────
 *
 * A stay's unit type includes a number of spaces (prd.md §7.1), and until this
 * existed the form never mentioned it — a guest booking a 2-bed for three cars
 * found out on arrival. `parking` makes the form say so: what the unit
 * includes, standing quietly under the rows, and a warning once the plates
 * entered are past it.
 *
 * **The desk's forms stop there.** Staff taking a booking have already agreed
 * the extra car with the guest, and a plate the form refused is a car nobody
 * can match at the gate (§12.5).
 *
 * **A customer's form stops at the allowance** (Jason's team, 19 September
 * 2026): `extraCarsContact` caps the rows at the spaces the unit includes, and
 * where the Add button was, a notice says to message the office first to
 * confirm another car. A customer who picks a smaller unit after typing more
 * plates is asked to remove the extra rows, and the action refuses them too —
 * the cap is a rule, not a courtesy of this screen.
 *
 * Day passes pass nothing: a pass has no unit and so no allowance, and visitor
 * parking is the other half of R3.
 */

interface VehicleFieldsProps {
  /** One entry per row, blanks included — the rows exactly as displayed. */
  vehicles: readonly string[]
  onChange: (vehicles: readonly string[]) => void
  noVehicle: boolean
  onNoVehicleChange: (noVehicle: boolean) => void
  error?: string
  /**
   * The line under the exception. Defaults to the desk's wording; pass `null`
   * to drop it, which the public forms do — a customer ticking "arriving
   * without a vehicle" does not need it explained, and the desk does, because
   * for them it is a record-keeping rule rather than a fact about their car.
   */
  noVehicleDescription?: string | null
  /**
   * The unit type's included parking, where the booking has one. Omitted by
   * the day-pass form and by any form whose unit type is not chosen yet — a
   * sentence about "this unit" before there is one would be a statement about
   * nothing.
   */
  parking?: { unitTypeName: string; spaces: number } | null
  /**
   * Who a customer asks for a car beyond the allowance. Passed by the public
   * stay form only, and only meaningful with `parking`: the rows then stop at
   * the spaces included, and a notice naming this number takes the Add
   * button's place. The desk's forms omit it and keep the warning.
   */
  extraCarsContact?: { display: string; href: string } | null
}

export function VehicleFields({
  vehicles,
  onChange,
  noVehicle,
  onNoVehicleChange,
  error,
  noVehicleDescription = 'Only for the rare guest with no car. Security check arrivals by registration, so a booking with neither a plate nor this box ticked cannot be matched at the gate.',
  parking = null,
  extraCarsContact = null,
}: VehicleFieldsProps) {
  // Always at least one row to type into: a section whose only control is an
  // "Add" button asks the staff member to do a step the form could have done.
  const rows = vehicles.length > 0 ? vehicles : ['']
  const limit = parking && extraCarsContact ? parking.spaces : null
  const canAdd =
    !noVehicle && rows.length < Math.min(MAX_VEHICLES_PER_BOOKING, limit ?? Infinity)

  // Ticking "arriving without a vehicle" makes the allowance moot, and a
  // warning left standing over disabled rows would be the form arguing with a
  // guest who has just said they have no car.
  const overflow = parking && !noVehicle ? vehiclesBeyondParking(rows, parking.spaces) : 0
  const spacesLabel = parking
    ? `${parking.spaces} parking ${parking.spaces === 1 ? 'space' : 'spaces'}`
    : null

  function setRow(index: number, value: string) {
    onChange(rows.map((row, current) => (current === index ? value : row)))
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, current) => current !== index))
  }

  return (
    <div className="grid gap-md">
      <div className="grid gap-sm">
        {rows.map((registration, index) => (
          // Rows are keyed by position, not by value. A plate is edited
          // character by character, so keying on it would unmount and remount
          // the input on every keystroke and take the caret with it.
          <div key={index} className="flex items-center gap-sm">
            <div className="grid gap-sm">
              {/* One label for the section, on the first row only: five
                  identical "Vehicle reg" labels stacked would be noise, and
                  the rows after the first are plainly more of the same. */}
              {index === 0 ? <Label htmlFor="vehicle-0">Registration</Label> : null}
              <Input
                id={`vehicle-${index}`}
                name="vehicles"
                placeholder="BAA 1234"
                value={registration}
                disabled={noVehicle}
                maxLength={MAX_VEHICLE_REGISTRATION_LENGTH}
                autoComplete="off"
                // Plates are read back to a guard, and lower case in a column
                // of registrations reads as a different kind of value. The
                // action normalises for storage regardless; this is so the
                // field looks like what it will become.
                className="w-[220px] uppercase"
                aria-invalid={error ? true : undefined}
                aria-label={index === 0 ? undefined : `Vehicle registration ${index + 1}`}
                onChange={(event) => setRow(index, event.target.value)}
              />
            </div>

            {/* The first row has no remove control while it is the only one —
                removing the last row would leave a section with nothing in it
                and no way to say why. */}
            {rows.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={noVehicle}
                className={index === 0 ? 'mt-[26px]' : undefined}
                aria-label={`Remove vehicle ${index + 1}`}
                onClick={() => removeRow(index)}
              >
                <X aria-hidden />
              </Button>
            ) : null}
          </div>
        ))}

        <FieldError message={error} />
      </div>

      {/* What the unit includes, and — once they are past it — what that means.

          The standing line is a caption because it is a fact about the unit,
          not a status; it only becomes a warning when it is about to cost
          somebody a parking space. Both say the same first sentence, so the
          warning reads as the line they have already seen, escalating. */}
      {parking && !noVehicle ? (
        overflow > 0 ? (
          <Notice tone="warning">
            <p>
              The {parking.unitTypeName} includes {spacesLabel}.{' '}
              {extraCarsContact ? (
                <>
                  Remove {overflow === 1 ? 'the extra car' : `the extra ${overflow} cars`} to
                  continue. To bring {overflow === 1 ? 'it' : 'them'}, message us on WhatsApp at{' '}
                  <ContactLink contact={extraCarsContact} /> first to confirm.
                </>
              ) : overflow === 1 ? (
                'The extra car is still recorded so Security can match it at the gate, but it may not have a bay.'
              ) : (
                `The extra ${overflow} cars are still recorded so Security can match them at the gate, but they may not have a bay.`
              )}
            </p>
          </Notice>
        ) : extraCarsContact && limit !== null && rows.length >= limit ? (
          // Where the Add button was: the allowance is reached, and the way to
          // another car is a conversation, not a row.
          <Notice>
            <p>
              The {parking.unitTypeName} includes {spacesLabel}. Bringing another car? Message us on
              WhatsApp at <ContactLink contact={extraCarsContact} /> first to confirm it.
            </p>
          </Notice>
        ) : (
          <p className="text-caption text-muted-foreground">
            The {parking.unitTypeName} includes {spacesLabel}.
          </p>
        )
      ) : null}

      {canAdd ? (
        <div>
          <Button type="button" variant="tertiary" onClick={() => onChange([...rows, ''])}>
            <Plus aria-hidden />
            Add another vehicle
          </Button>
        </div>
      ) : null}

      {/* The fallback, kept visually subordinate to the rows above it.

          Alignment follows the row's height rather than being one rule: with
          a description under it the label block is two lines, so the box
          belongs at the top and needs the optical nudge that puts it on the
          first line's centre. On its own — which is what both public forms
          pass — the row is one line, and `items-start` plus a nudge left the
          box sitting visibly high against it. */}
      <div
        className={cn(
          'flex gap-sm',
          noVehicleDescription === null ? 'items-center' : 'items-start',
        )}
      >
        <Checkbox
          id="noVehicle"
          checked={noVehicle}
          className={noVehicleDescription === null ? undefined : 'mt-[3px]'}
          onCheckedChange={(checked) => onNoVehicleChange(checked === true)}
        />
        <div className="grid gap-xxs">
          <Label htmlFor="noVehicle">Arriving without a vehicle</Label>
          {noVehicleDescription === null ? null : (
            <p className="text-caption text-muted-foreground">{noVehicleDescription}</p>
          )}
        </div>
      </div>

      {/* Submitted as an explicit value rather than left to the checkbox's own
          hidden field, which is absent when clear — so the action reads a
          decision on every submit instead of inferring one from a missing key. */}
      <input type="hidden" name="noVehicle" value={noVehicle ? 'true' : 'false'} />
    </div>
  )
}

/** The number a customer messages about another car, opening the chat. */
function ContactLink({ contact }: { contact: { display: string; href: string } }) {
  return (
    <a
      href={contact.href}
      target="_blank"
      rel="noreferrer"
      className="font-medium whitespace-nowrap underline underline-offset-2"
    >
      {contact.display}
    </a>
  )
}
