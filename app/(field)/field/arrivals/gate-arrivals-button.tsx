'use client'

import { startTransition, useActionState, useEffect, useState, type FormEvent } from 'react'
import { Pencil, UserPlus, Users } from 'lucide-react'

import { COUNT_MAY_NOT_HAVE_GONE_THROUGH } from '@/components/field/did-not-go-through'
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
import { Notice } from '@/components/ui/notice'
import { toast } from '@/components/ui/toast-store'
import type { GateBooking } from '@/lib/db/gate'
import {
  arrivalsCountRange,
  arrivalsTargetOf,
  extrasToReport,
  gateArrivalsLine,
  type GateArrivals,
} from '@/lib/domain/gate-arrivals'
import { cn } from '@/lib/utils'

import { recordArrivalsAtGateAction, type ArrivalsState } from './arrivals-actions'
import { ExtraGuestsRemark } from './extra-guests-remark'

/**
 * Counting people through the gate after the first group (capability D8).
 *
 * Three ways in, one dialog, one write:
 *
 * - **Record arrivals** — full width at the foot of the card while anyone
 *   booked is still to come, opening on everyone still to come.
 * - **Extra** — the small button beside the party once everyone booked is in,
 *   opening on one: the car with more people than the booking is for. It
 *   keeps the place and name it had before the count existed.
 * - **Correct** — beside the count, for a mis-tap: the total as it really is.
 *   The same write, and the booking's history says it was a correction.
 *
 * The dialog posts the count the card showed, and the server records nothing
 * if that has moved — a second phone counted the same car, or a press was
 * repeated after an answer was lost on one bar of signal.
 */

type ArrivalsKind = 'more' | 'correct'

interface ArrivalsDialogProps {
  kind: ArrivalsKind
  booking: GateBooking
  arrivals: GateArrivals
  /** What the counter opens on. */
  initial: number
}

export function RecordArrivalsButton({
  booking,
  arrivals,
  isPrimary,
  className,
}: Omit<ArrivalsDialogProps, 'kind' | 'initial'> & { isPrimary: boolean; className?: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        size="touch"
        variant={isPrimary ? 'primary' : 'tertiary'}
        className={cn('w-full', className)}
        onClick={() => setIsOpen(true)}
      >
        <Users aria-hidden />
        Record arrivals
      </Button>

      {/* Mounted only while open, so it opens on the card as it is now. */}
      {isOpen ? (
        <ArrivalsDialog
          kind="more"
          booking={booking}
          arrivals={arrivals}
          initial={arrivals.toCome}
          onClose={() => setIsOpen(false)}
        />
      ) : null}
    </>
  )
}

export function ExtraArrivalsButton({
  booking,
  arrivals,
}: Omit<ArrivalsDialogProps, 'kind' | 'initial'>) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="tertiary"
        size="touch"
        className="px-md"
        aria-label={`More people than booked for ${booking.guestName}`}
        onClick={() => setIsOpen(true)}
      >
        <UserPlus aria-hidden />
        Extra
      </Button>

      {isOpen ? (
        <ArrivalsDialog
          kind="more"
          booking={booking}
          arrivals={arrivals}
          initial={1}
          onClose={() => setIsOpen(false)}
        />
      ) : null}
    </>
  )
}

export function CorrectArrivalsButton({
  booking,
  arrivals,
}: Omit<ArrivalsDialogProps, 'kind' | 'initial'>) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="tertiary"
        size="touch"
        className="px-md"
        aria-label={`Correct the count for ${booking.guestName}`}
        onClick={() => setIsOpen(true)}
      >
        <Pencil aria-hidden />
        Correct
      </Button>

      {isOpen ? (
        <ArrivalsDialog
          kind="correct"
          booking={booking}
          arrivals={arrivals}
          initial={arrivals.arrived}
          onClose={() => setIsOpen(false)}
        />
      ) : null}
    </>
  )
}

const idle: ArrivalsState = { status: 'idle' }

function ArrivalsDialog({
  kind,
  booking,
  arrivals,
  initial,
  onClose,
}: ArrivalsDialogProps & { onClose: () => void }) {
  const range = arrivalsCountRange(kind, booking.partySize, arrivals)
  const [countText, setCountText] = useState(String(initial))
  const count = /^\d+$/.test(countText) ? Number(countText) : null
  // The count when it is one the server will take, and null otherwise.
  const valid = count !== null && count >= range.min && count <= range.max ? count : null
  const isChange = kind === 'more' || valid !== arrivals.arrived
  const target = valid === null ? null : arrivalsTargetOf({ kind, count: valid }, arrivals.arrived)
  const toTell =
    target === null ? 0 : extrasToReport(target, booking.partySize, booking.extraReported)

  const [state, formAction, isPending] = useActionState(
    async (previous: ArrivalsState, formData: FormData): Promise<ArrivalsState> => {
      let result: ArrivalsState

      try {
        result = await recordArrivalsAtGateAction(previous, formData)
      } catch {
        return { status: 'error', message: COUNT_MAY_NOT_HAVE_GONE_THROUGH }
      }

      // Here rather than in an effect: the same response re-renders the card,
      // which can unmount this dialog before an effect would run.
      if (result.status === 'done' && result.done) {
        const { guestName, corrected, detail } = result.done

        toast({
          tone: 'positive',
          title: corrected
            ? `Count corrected for ${guestName}`
            : `Arrivals recorded for ${guestName}`,
          description: `${booking.reference} · ${detail}`,
        })
      }

      return result
    },
    idle,
  )

  useEffect(() => {
    if (state.status === 'done') {
      onClose()
    }
  }, [state.status, onClose])

  function submit(event: FormEvent<HTMLFormElement>) {
    // Through a transition rather than `action=`: React 19 resets a form once
    // its action settles, which would empty the count on a refusal.
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(() => formAction(formData))
  }

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>
            {kind === 'correct' ? 'Correct the count?' : 'Record arrivals?'}
          </DialogTitle>
          <DialogDescription>
            {booking.guestName} · {booking.reference} · {booking.unitRef ?? 'Day pass'}.{' '}
            {gateArrivalsLine(arrivals)}.
            {kind === 'correct'
              ? ' Say how many have really come through, in all. The correction shows in the booking’s history.'
              : ''}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-lg">
          <input type="hidden" name="bookingId" value={booking.id} />
          <input type="hidden" name="stream" value={booking.stream} />
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="expectedArrived" value={arrivals.arrived} />

          <div className="grid gap-sm">
            <Label htmlFor="arrivals-count">
              {kind === 'correct'
                ? 'How many have come through in all?'
                : 'How many more are here now?'}
            </Label>
            <Input
              id="arrivals-count"
              name="count"
              type="number"
              inputMode="numeric"
              inputSize="touch"
              min={range.min}
              max={range.max}
              className="w-[120px] tabular-nums"
              value={countText}
              onChange={(event) => setCountText(event.target.value)}
            />
          </div>

          {toTell > 0 ? (
            <>
              <Notice>
                {toTell} more than booked. The office is told, and sorts out any extra charge.
              </Notice>
              <ExtraGuestsRemark />
            </>
          ) : null}

          {state.status === 'error' ? <FieldError message={state.message} /> : null}

          <DialogFooter>
            <Button type="button" variant="tertiary" size="touch" onClick={onClose}>
              Not yet
            </Button>
            <Button type="submit" size="touch" disabled={valid === null || !isChange || isPending}>
              {isPending ? 'Recording…' : kind === 'correct' ? 'Correct' : 'Record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
