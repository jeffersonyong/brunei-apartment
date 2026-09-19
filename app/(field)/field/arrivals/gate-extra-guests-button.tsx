'use client'

import { startTransition, useActionState, useEffect, useState, type FormEvent } from 'react'
import { UserPlus } from 'lucide-react'

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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast-store'
import type { GateBooking } from '@/lib/db/gate'
import type { PropertyConfig } from '@/lib/domain/config'
import {
  addToParty,
  countsOf,
  MAX_EXTRA_GUESTS,
  MAX_EXTRA_GUESTS_REMARK_LENGTH,
} from '@/lib/domain/extra-guests'
import { mayAddVisitorsAtGate } from '@/lib/domain/gate'
import { formatCents, type Cents } from '@/lib/domain/money'
import { repriceDayPassParty } from '@/lib/domain/pricing/party-change'

import {
  addToPassAtGateAction,
  reportExtraGuestsAction,
  type ExtraGuestsState,
} from './extra-guests-actions'

/**
 * More people at the car than the booking is for (Jason's team, 19 September
 * 2026).
 *
 * A small button beside the party on the card, because it is the exception —
 * most cars match their booking, and the card is already carrying the plate,
 * the dates, the money and the move. It opens one of two dialogs:
 *
 * - **Tell the office** — how many more, and anything the guard wants to add.
 *   It becomes a note on the booking and a line in the office's bell. A stay
 *   always; a pass when the guard cannot settle it himself.
 * - **Add them to the pass** — who the extra visitors are by age band, priced
 *   as the pass was sold, and the difference taken in cash on the spot. A pass
 *   on its day that is open and has no transfer waiting, for a guard who takes
 *   cash. He can still switch to telling the office, for visitors who will not
 *   pay.
 */

const initialState: ExtraGuestsState = { status: 'idle' }

interface GateExtraGuestsButtonProps {
  booking: GateBooking
  /** The unit, or "Day pass · 3 people". */
  place: string
  /** Everybody the booking is for. */
  bookedFor: number
  /** The rates, for a reader who may add visitors to a pass and take the cash. */
  passPricing: PropertyConfig | null
}

export function GateExtraGuestsButton(props: GateExtraGuestsButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="tertiary"
        size="touch"
        className="px-md"
        aria-label={`More people than booked for ${props.booking.guestName}`}
        onClick={() => setIsOpen(true)}
      >
        <UserPlus aria-hidden />
        Extra
      </Button>

      {/* Mounted only while open, so it opens on the card as it is now. */}
      {isOpen ? <ExtraGuestsDialog {...props} onClose={() => setIsOpen(false)} /> : null}
    </>
  )
}

function ExtraGuestsDialog({
  booking,
  place,
  bookedFor,
  passPricing,
  onClose,
}: GateExtraGuestsButtonProps & { onClose: () => void }) {
  const canAdd =
    booking.party.kind === 'pass' &&
    passPricing !== null &&
    booking.passFigures !== null &&
    mayAddVisitorsAtGate(booking.verdict)
  const [mode, setMode] = useState<'add' | 'report'>(canAdd ? 'add' : 'report')

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-w-[440px]">
        {mode === 'add' && canAdd && passPricing && booking.passFigures ? (
          <AddToPass
            booking={booking}
            place={place}
            bookedFor={bookedFor}
            config={passPricing}
            figures={booking.passFigures}
            onReportInstead={() => setMode('report')}
            onClose={onClose}
          />
        ) : (
          <TellTheOffice booking={booking} place={place} bookedFor={bookedFor} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  )
}

/** The action wrapped so the toast is said the moment the server answers. */
function useExtraGuestsAction(
  action: typeof reportExtraGuestsAction,
  reference: string,
  onClose: () => void,
) {
  const [state, formAction, isPending] = useActionState(
    async (previous: ExtraGuestsState, formData: FormData): Promise<ExtraGuestsState> => {
      let result: ExtraGuestsState

      try {
        result = await action(previous, formData)
      } catch {
        return {
          status: 'error',
          message: 'That did not reach the office. Refresh the list before trying again.',
        }
      }

      // Here rather than in an effect: the same response re-renders the card,
      // which can unmount this dialog before an effect would run (see
      // gate-cash-button.tsx).
      if (result.status === 'done' && result.done) {
        const { guestName, taken, reported } = result.done

        toast({
          tone: 'positive',
          title:
            taken === null
              ? `The office is told: ${reported} more with ${guestName}`
              : taken > 0
                ? `BND ${formatCents(taken)} taken — ${reported} added to the pass`
                : `${reported} added to the pass`,
          description: reference,
        })
      }

      return result
    },
    initialState,
  )

  useEffect(() => {
    if (state.status === 'done') {
      onClose()
    }
  }, [state.status, onClose])

  function submit(event: FormEvent<HTMLFormElement>) {
    // Through a transition rather than `action=`: React 19 resets a form once
    // its action settles, which would empty what the guard typed on a refusal.
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(() => formAction(formData))
  }

  return { state, submit, isPending }
}

function TellTheOffice({
  booking,
  place,
  bookedFor,
  onClose,
}: {
  booking: GateBooking
  place: string
  bookedFor: number
  onClose: () => void
}) {
  const { state, submit, isPending } = useExtraGuestsAction(
    reportExtraGuestsAction,
    booking.reference,
    onClose,
  )
  const [extra, setExtra] = useState('1')
  const isValid = /^\d+$/.test(extra) && Number(extra) >= 1 && Number(extra) <= MAX_EXTRA_GUESTS

  return (
    <>
      <DialogHeader>
        <DialogTitle>More people than booked?</DialogTitle>
        <DialogDescription>
          {booking.reference} · {place}. Booked for {bookedFor}. The office is told, and sorts out
          any extra charge.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={submit} className="grid gap-lg">
        <input type="hidden" name="bookingId" value={booking.id} />
        <input type="hidden" name="stream" value={booking.stream} />

        <div className="grid gap-sm">
          <Label htmlFor="extra-guests">How many more?</Label>
          <Input
            id="extra-guests"
            name="extra"
            type="number"
            inputMode="numeric"
            inputSize="touch"
            min={1}
            max={MAX_EXTRA_GUESTS}
            className="w-[120px] tabular-nums"
            value={extra}
            onChange={(event) => setExtra(event.target.value)}
          />
        </div>

        <Remark />

        {state.status === 'error' ? <FieldError message={state.message} /> : null}

        <DialogFooter>
          <Button type="button" variant="tertiary" size="touch" onClick={onClose}>
            Not now
          </Button>
          <Button type="submit" size="touch" disabled={!isValid || isPending}>
            {isPending ? 'Sending…' : 'Tell the office'}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

function AddToPass({
  booking,
  place,
  bookedFor,
  config,
  figures,
  onReportInstead,
  onClose,
}: {
  booking: GateBooking
  place: string
  bookedFor: number
  config: PropertyConfig
  figures: { total: Cents; paid: Cents }
  onReportInstead: () => void
  onClose: () => void
}) {
  const { state, submit, isPending } = useExtraGuestsAction(
    addToPassAtGateAction,
    booking.reference,
    onClose,
  )
  const [added, setAdded] = useState<Record<string, number>>({})
  const sold = booking.party.kind === 'pass' ? countsOf(booking.party.bands) : {}
  const addedCount = Object.values(added).reduce((sum, value) => sum + value, 0)
  const repriced = addedCount > 0 ? repriceDayPassParty(addToParty(sold, added), config) : null
  const take = repriced?.ok ? repriced.total - figures.paid : null

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add visitors to the pass?</DialogTitle>
        <DialogDescription>
          {booking.reference} · {place}. Booked for {bookedFor}. They are added to the pass, and you
          take the difference in cash, under your name.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={submit} className="grid gap-lg">
        <input type="hidden" name="bookingId" value={booking.id} />
        <input type="hidden" name="expectedTake" value={take ?? 0} />
        <input type="hidden" name="expectedHeadcount" value={booking.headcount ?? 0} />

        <fieldset className="grid gap-md">
          <legend className="micro-label text-muted-foreground">Extra visitors</legend>
          <div className="flex flex-wrap gap-lg">
            {config.dayPassAgeBands.map((band) => (
              <div key={band.id} className="grid gap-sm">
                <Label htmlFor={`add-${band.id}`}>{band.label}</Label>
                <Input
                  id={`add-${band.id}`}
                  name={`band-${band.id}`}
                  type="number"
                  inputMode="numeric"
                  inputSize="touch"
                  min={0}
                  max={MAX_EXTRA_GUESTS}
                  className="w-[96px] tabular-nums"
                  value={added[band.id] ?? 0}
                  onChange={(event) => {
                    const value = Math.max(0, Math.trunc(Number(event.target.value) || 0))

                    setAdded((current) => ({ ...current, [band.id]: value }))
                  }}
                />
              </div>
            ))}
          </div>
        </fieldset>

        {repriced && !repriced.ok ? <FieldError message={repriced.message} /> : null}

        {take !== null ? (
          <p className="text-body-md-strong text-foreground tabular-nums">
            {take > 0 ? `Take BND ${formatCents(take)}` : 'Nothing more to pay'}
            <span className="text-body-sm font-normal text-muted-foreground">
              {' '}
              · the pass becomes BND {formatCents(repriced?.ok ? repriced.total : figures.total)}
            </span>
          </p>
        ) : null}

        <Remark />

        {state.status === 'error' ? <FieldError message={state.message} /> : null}

        <DialogFooter>
          <Button type="button" variant="tertiary" size="touch" onClick={onReportInstead}>
            They won’t pay — tell the office
          </Button>
          <Button type="submit" size="touch" disabled={take === null || take < 0 || isPending}>
            {isPending
              ? 'Recording…'
              : take !== null && take > 0
                ? `Take BND ${formatCents(take)}`
                : 'Add them'}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

function Remark() {
  return (
    <div className="grid gap-sm">
      <Label htmlFor="extra-guests-remark">Anything to add (optional)</Label>
      <Textarea
        id="extra-guests-remark"
        name="remark"
        maxLength={MAX_EXTRA_GUESTS_REMARK_LENGTH}
        placeholder="Came in a second car"
      />
    </div>
  )
}
