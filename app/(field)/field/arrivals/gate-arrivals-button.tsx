'use client'

import { startTransition, useActionState, useEffect, useState, type FormEvent } from 'react'
import { Users } from 'lucide-react'

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
  arrivalsSumLine,
  arrivalsTargetOf,
  extrasToReport,
  gateArrivalsLine,
  gateArrivalsOf,
  overBookingNotice,
  type GateArrivals,
} from '@/lib/domain/gate-arrivals'
import { cn } from '@/lib/utils'

import { recordArrivalsAtGateAction, type ArrivalsState } from './arrivals-actions'
import { ExtraGuestsRemark } from './extra-guests-remark'

/**
 * Counting people through the gate after the first group (capability D8).
 *
 * **One button** (Jeff, 29 September 2026, after trying two: a separate Extra
 * and Correct both added people, and did the same thing twice). *Record
 * arrivals* is full width at the foot of the card while anyone booked is
 * still to come, opening on everyone still to come; once everyone booked is
 * in it is a small button beside the count, opening on one — the car with
 * more people than the booking is for.
 *
 * **It counts the car in front of the guard**, and says the sum as he types
 * ("1 in already + 3 now = 4 in all"), so he never adds up in his head. A
 * mis-tap is put right in the same box: *Correct the count instead* switches
 * it to the total as it really is. The same write either way, and the
 * booking's history says which it was.
 *
 * The box posts the count the card showed, and the server records nothing if
 * that has moved — a second phone counted the same car, or a press was
 * repeated after an answer was lost on one bar of signal.
 */

type ArrivalsKind = 'more' | 'correct'

interface RecordArrivalsButtonProps {
  booking: GateBooking
  arrivals: GateArrivals
  /**
   * `full` at the foot of the card while anyone booked is still to come;
   * `small` beside the count once everyone booked is in.
   */
  size: 'full' | 'small'
  /** The card's main button, when it has nothing else to do (`full` only). */
  isPrimary?: boolean
  className?: string
}

export function RecordArrivalsButton({
  booking,
  arrivals,
  size,
  isPrimary = false,
  className,
}: RecordArrivalsButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        size="touch"
        variant={size === 'full' && isPrimary ? 'primary' : 'tertiary'}
        className={cn(size === 'full' ? 'w-full' : 'px-md', className)}
        aria-label={size === 'small' ? `Record arrivals for ${booking.guestName}` : undefined}
        onClick={() => setIsOpen(true)}
      >
        <Users aria-hidden />
        Record arrivals
      </Button>

      {/* Mounted only while open, so it opens on the card as it is now. */}
      {isOpen ? (
        <ArrivalsDialog booking={booking} arrivals={arrivals} onClose={() => setIsOpen(false)} />
      ) : null}
    </>
  )
}

const idle: ArrivalsState = { status: 'idle' }

/** What the counter opens on: everyone still to come, or one more once everyone is in. */
function opening(kind: ArrivalsKind, arrivals: GateArrivals): string {
  return String(kind === 'correct' ? arrivals.arrived : Math.max(arrivals.toCome, 1))
}

function ArrivalsDialog({
  booking,
  arrivals,
  onClose,
}: {
  booking: GateBooking
  arrivals: GateArrivals
  onClose: () => void
}) {
  const [kind, setKind] = useState<ArrivalsKind>('more')
  const [countText, setCountText] = useState(opening('more', arrivals))
  const range = arrivalsCountRange(kind, booking.partySize, arrivals)
  const count = /^\d+$/.test(countText) ? Number(countText) : null
  // The count when it is one the server will take, and null otherwise.
  const valid = count !== null && count >= range.min && count <= range.max ? count : null
  const isChange = kind === 'more' || valid !== arrivals.arrived
  const target = valid === null ? null : arrivalsTargetOf({ kind, count: valid }, arrivals.arrived)
  const notice =
    target === null
      ? null
      : overBookingNotice(gateArrivalsOf(booking.partySize, target), booking.extraReported)
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

  function switchTo(next: ArrivalsKind) {
    setKind(next)
    setCountText(opening(next, arrivals))
  }

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
            {kind === 'correct' ? ' The correction shows in the booking’s history.' : ''}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-lg">
          <input type="hidden" name="bookingId" value={booking.id} />
          <input type="hidden" name="stream" value={booking.stream} />
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="expectedArrived" value={arrivals.arrived} />

          <div className="grid gap-sm">
            <Label htmlFor="arrivals-count">
              {kind === 'correct' ? 'How many have come through in all?' : 'How many just arrived?'}
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
            {valid !== null ? (
              <p className="text-body-sm text-muted-foreground tabular-nums">
                {arrivalsSumLine(kind, arrivals.arrived, valid)}
              </p>
            ) : null}
          </div>

          {notice ? <Notice>{notice}</Notice> : null}

          {toTell > 0 ? <ExtraGuestsRemark /> : null}

          {state.status === 'error' ? <FieldError message={state.message} /> : null}

          <DialogFooter>
            <Button
              type="button"
              variant="tertiary"
              size="touch"
              onClick={() => switchTo(kind === 'more' ? 'correct' : 'more')}
            >
              {kind === 'more' ? 'Correct the count instead' : 'Record arrivals instead'}
            </Button>
            <Button type="button" variant="tertiary" size="touch" onClick={onClose}>
              Not yet
            </Button>
            <Button type="submit" size="touch" disabled={valid === null || !isChange || isPending}>
              {isPending
                ? 'Recording…'
                : kind === 'correct'
                  ? 'Correct'
                  : valid !== null
                    ? `Record ${valid}`
                    : 'Record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
