'use client'

import { startTransition, useActionState, useEffect, useState } from 'react'

import { NumberField } from '@/components/portal/form-fields'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldError } from '@/components/ui/field-error'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast-store'
import { balanceOf } from '@/lib/domain/balance'
import type { PropertyConfig } from '@/lib/domain/config'
import type { Discount } from '@/lib/domain/discount'
import type { BookingLine } from '@/lib/domain/lines'
import { formatCents, type Cents } from '@/lib/domain/money'
import { repriceDayPassParty, repriceStayParty } from '@/lib/domain/pricing/party-change'

import { changePartyAction, type ChangePartyState } from './party-actions'

/**
 * Changing how many people a booking is for (Jason's team, 19 September 2026).
 *
 * Opened from the Party line on the booking. The guard reports more people
 * than were booked, or a family says two are not coming — and the office
 * changes the numbers here, on a stay whether or not it is checked in, or on a
 * day pass. The price is worked out again as the numbers change, and the
 * dialog says what that leaves before anything is saved: what the guest will
 * owe, or what the booking will owe them. The server prices it again from the
 * booking itself; this is the preview.
 *
 * A stay only costs more above its unit type's maximum, so most changes to a
 * stay move nothing but the count — and the dialog says so rather than
 * showing an unchanged total as though it were news.
 */

const initialState: ChangePartyState = { status: 'idle' }

export type ChangePartySubject =
  | {
      kind: 'stay'
      chargeableGuests: number
      exemptGuests: number
      lines: readonly BookingLine[]
      unitType: { name: string; maxPax: number }
      nights: number
      discount: Discount | null
    }
  | {
      kind: 'pass'
      /** Counts by band as sold. */
      counts: Readonly<Record<string, number>>
    }

interface ChangePartyProps {
  bookingId: string
  reference: string
  /** The booking's `updated_at`, opaque, for the optimistic check. */
  updatedAt: string
  total: Cents
  paid: Cents
  subject: ChangePartySubject
  config: PropertyConfig
}

export function ChangeParty(props: ChangePartyProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        className="-my-xs h-auto px-sm py-xxs text-body-sm"
        onClick={() => setIsOpen(true)}
      >
        Change
      </Button>

      {/* Mounted only while open, so it opens on the booking as it is now. */}
      {isOpen ? <ChangePartyDialog {...props} onClose={() => setIsOpen(false)} /> : null}
    </>
  )
}

function ChangePartyDialog({
  bookingId,
  reference,
  updatedAt,
  total,
  paid,
  subject,
  config,
  onClose,
}: ChangePartyProps & { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(changePartyAction, initialState)
  const [chargeable, setChargeable] = useState(
    subject.kind === 'stay' ? subject.chargeableGuests : 0,
  )
  const [exempt, setExempt] = useState(subject.kind === 'stay' ? subject.exemptGuests : 0)
  const [bands, setBands] = useState<Record<string, number>>(
    subject.kind === 'pass' ? { ...subject.counts } : {},
  )

  useEffect(() => {
    if (state.status === 'done') {
      toast({ tone: 'positive', title: 'Party changed', description: reference })
      onClose()
    }
  }, [state.status, reference, onClose])

  const isDirty =
    subject.kind === 'stay'
      ? chargeable !== subject.chargeableGuests || exempt !== subject.exemptGuests
      : config.dayPassAgeBands.some(
          (band) => (bands[band.id] ?? 0) !== (subject.counts[band.id] ?? 0),
        )

  const preview = priceOf(subject, config, { chargeable, exempt, bands })

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Change the party</DialogTitle>
          <DialogDescription>
            {reference}. The price is worked out again for the new numbers. What has been paid stays
            as it is.
          </DialogDescription>
        </DialogHeader>

        {/* Submitted through a transition rather than `action=`: React 19
            resets a form once its action settles, which would empty the reason
            the moment the server refused a change. */}
        <form
          className="grid gap-lg"
          onSubmit={(event) => {
            event.preventDefault()
            const formData = new FormData(event.currentTarget)

            startTransition(() => formAction(formData))
          }}
        >
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="expectedUpdatedAt" value={updatedAt} />

          <div className="flex flex-wrap gap-lg">
            {subject.kind === 'stay' ? (
              <>
                <NumberField
                  id="chargeableGuests"
                  label={`Over ${config.paxExemptAgeMax}`}
                  value={chargeable}
                  min={1}
                  max={50}
                  onChange={setChargeable}
                />
                <NumberField
                  id="exemptGuests"
                  label={`Aged ${config.paxExemptAgeMax} and under`}
                  value={exempt}
                  min={0}
                  max={50}
                  onChange={setExempt}
                />
              </>
            ) : (
              config.dayPassAgeBands.map((band) => (
                <NumberField
                  key={band.id}
                  id={`band-${band.id}`}
                  label={band.label}
                  value={bands[band.id] ?? 0}
                  min={0}
                  max={50}
                  onChange={(value) => setBands((current) => ({ ...current, [band.id]: value }))}
                />
              ))
            )}
          </div>

          <PartyOutcome
            isDirty={isDirty}
            before={total}
            preview={preview}
            paid={paid}
            isStay={subject.kind === 'stay'}
          />

          <div className="grid gap-sm">
            <Label htmlFor="party-reason">Why (optional)</Label>
            <Textarea
              id="party-reason"
              name="reason"
              maxLength={280}
              placeholder="Two more arrived at the gate"
            />
          </div>

          {state.status === 'error' ? <FieldError message={state.message} /> : null}

          <DialogFooter>
            <Button type="button" variant="tertiary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isDirty || !preview.ok || isPending}>
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type Preview = { ok: true; total: Cents } | { ok: false; message: string }

function priceOf(
  subject: ChangePartySubject,
  config: PropertyConfig,
  draft: { chargeable: number; exempt: number; bands: Readonly<Record<string, number>> },
): Preview {
  if (subject.kind === 'pass') {
    const repriced = repriceDayPassParty(draft.bands, config)

    return repriced.ok ? { ok: true, total: repriced.total } : repriced
  }

  const repriced = repriceStayParty(
    {
      lines: subject.lines,
      unitType: subject.unitType,
      nights: subject.nights,
      party: { chargeableGuests: draft.chargeable, exemptGuests: draft.exempt },
      discount: subject.discount,
    },
    config,
  )

  return repriced.ok
    ? { ok: true, total: repriced.total }
    : { ok: false, message: repriced.error.message }
}

/**
 * What the change leaves, said before it is saved — the new total, and
 * whichever way the money now points.
 */
function PartyOutcome({
  isDirty,
  before,
  preview,
  paid,
  isStay,
}: {
  isDirty: boolean
  before: Cents
  preview: Preview
  paid: Cents
  isStay: boolean
}) {
  if (!isDirty) {
    return null
  }

  if (!preview.ok) {
    return <FieldError message={preview.message} />
  }

  if (preview.total === before) {
    return (
      <p className="text-body-sm text-muted-foreground">
        {isStay
          ? 'No change to the price — the stay is still within what the unit takes before extra guests are charged.'
          : 'No change to the price.'}
      </p>
    )
  }

  const balance = balanceOf(preview.total, paid)

  return (
    <div className="grid gap-xs rounded-md bg-muted p-md">
      <div className="flex items-baseline justify-between gap-lg">
        <span className="text-body-sm text-muted-foreground">Total</span>
        <span className="text-body-sm text-foreground tabular-nums">
          BND {formatCents(before)} → BND {formatCents(preview.total)}
        </span>
      </div>
      <p className="text-body-sm-strong text-foreground">
        {balance.state === 'outstanding'
          ? `The guest will owe BND ${formatCents(balance.outstanding)}.`
          : balance.state === 'overpaid'
            ? `The booking will owe the guest BND ${formatCents(-balance.outstanding)}. Settle it with them outside the system.`
            : 'What has been paid covers it exactly.'}
      </p>
    </div>
  )
}
