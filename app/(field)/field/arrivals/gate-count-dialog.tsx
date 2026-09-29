'use client'

import { startTransition, useActionState, useEffect, useState, type FormEvent } from 'react'

import {
  CASH_MAY_NOT_HAVE_GONE_THROUGH,
  DID_NOT_GO_THROUGH,
} from '@/components/field/did-not-go-through'
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
import type { PropertyConfig } from '@/lib/domain/config'
import {
  arrivalsCountRange,
  extrasToReport,
  firstCountExtrasRouteOf,
  gateArrivalsOf,
  overBookingNotice,
} from '@/lib/domain/gate-arrivals'
import { formatCents } from '@/lib/domain/money'

import { admitAtGateAction, checkInAtGateAction, type GateActionState } from './actions'
import { ExtraGuestsRemark } from './extra-guests-remark'
import { admitWithExtrasAtGateAction, type ExtraGuestsState } from './extra-guests-actions'
import { PassExtrasFields, usePassExtras } from './pass-extras-fields'
import { STACKED_FOOTER } from './stacked-footer'

/**
 * Checking a stay in, or admitting a day pass — and counting the guests in as
 * it happens (capability D8).
 *
 * The first question is how many are here now, and it opens on the whole
 * party because most cars match their booking. A smaller number leaves the
 * rest to come, and the card counts them in later with Record arrivals. A
 * larger one is recorded as it is — the count records who came through, and
 * the app never turns anyone away:
 *
 * - **on a pass the guard can settle** — its own day, paid, no transfer
 *   waiting, and a guard who takes cash — he names the extra visitors by age
 *   band, takes the difference, and admits them all in one press
 *   (`admitWithExtrasAtGateAction`). *Tell the office instead* admits
 *   everyone and leaves the money to the office.
 * - **anything else** — a stay, or a pass he cannot settle — is admitted or
 *   checked in with the count, and the office is told about the extras.
 *
 * **No signal is a sentence, not a crash**, as on every gate write. Where
 * cash may have moved, the sentence sends the guard to refresh rather than
 * straight back to the button.
 */

export type CountMove = 'check_in' | 'admit'

const COPY: Readonly<
  Record<
    CountMove,
    {
      label: string
      pending: string
      title: (name: string) => string
      done: (name: string) => string
    }
  >
> = {
  check_in: {
    label: 'Check in',
    pending: 'Checking in…',
    title: (name) => `Check in ${name}?`,
    done: (name) => `${name} is checked in`,
  },
  admit: {
    label: 'Admit',
    pending: 'Admitting…',
    title: (name) => `Admit ${name}?`,
    done: (name) => `${name} is admitted`,
  },
}

const idle: GateActionState = { status: 'idle' }
const idleExtras: ExtraGuestsState = { status: 'idle' }

export interface GateCountDialogProps {
  move: CountMove
  booking: GateBooking
  /** Said before the guard confirms, when there is something to know. */
  note?: string
  /** Whether the reader takes cash — offered the pass settle only if so. */
  takesCash: boolean
  /** The pass rates, for a reader who may add visitors to a pass and take the cash. */
  passPricing: PropertyConfig | null
  onClose: () => void
}

export function GateCountDialog({
  move,
  booking,
  note,
  takesCash,
  passPricing,
  onClose,
}: GateCountDialogProps) {
  const copy = COPY[move]
  // The unit, or "Day pass": how many it is for is said beside it.
  const place = booking.unitRef ?? 'Day pass'
  const booked = booking.partySize
  const range = arrivalsCountRange('first', booked, null)
  const [countText, setCountText] = useState(String(booked))
  const count = /^\d+$/.test(countText) ? Number(countText) : null
  // The count when it is one the server will take, and null otherwise.
  const valid = count !== null && count >= range.min && count <= range.max ? count : null
  const over = valid === null ? 0 : Math.max(valid - booked, 0)
  const toCome = valid === null ? 0 : Math.max(booked - valid, 0)
  // The whole overage, and what the office hears of it — some may already
  // have been reported before anybody was let in.
  const notice =
    valid === null ? null : overBookingNotice(gateArrivalsOf(booked, valid), booking.extraReported)
  const toTell = valid === null ? 0 : extrasToReport(valid, booked, booking.extraReported)

  const canSettle =
    firstCountExtrasRouteOf({
      stream: booking.stream,
      verdict: booking.verdict,
      takesCash,
      moneySettled: !booking.moneyUnsettled,
      hasRates: passPricing !== null && booking.passFigures !== null,
    }) === 'settle'
  const [tellOfficeInstead, setTellOfficeInstead] = useState(false)
  const settles = over > 0 && canSettle && !tellOfficeInstead

  const [plain, plainAction, plainPending] = useActionState(
    async (previous: GateActionState, formData: FormData): Promise<GateActionState> => {
      const action = move === 'check_in' ? checkInAtGateAction : admitAtGateAction
      let result: GateActionState

      try {
        result = await action(previous, formData)
      } catch {
        return { status: 'error', message: DID_NOT_GO_THROUGH }
      }

      // Said here, the moment the server answers, and not from an effect: the
      // same response re-renders the list with this card moved, which can
      // unmount this dialog before an effect would run.
      if (result.status === 'done') {
        toast({
          tone: 'positive',
          title: copy.done(result.guestName ?? booking.guestName),
          description: `${booking.reference} · ${result.detail ?? place}`,
        })
      }

      return result
    },
    idle,
  )

  const [settled, settleAction, settlePending] = useActionState(
    async (previous: ExtraGuestsState, formData: FormData): Promise<ExtraGuestsState> => {
      let result: ExtraGuestsState

      try {
        result = await admitWithExtrasAtGateAction(previous, formData)
      } catch {
        return { status: 'error', message: CASH_MAY_NOT_HAVE_GONE_THROUGH }
      }

      if (result.status === 'done' && result.done) {
        const { guestName, taken, admitted, extra } = result.done

        toast({
          tone: 'positive',
          title:
            taken > 0
              ? `BND ${formatCents(taken)} taken — ${guestName} admitted`
              : `${guestName} is admitted`,
          description: `${booking.reference} · ${admitted} in, ${extra} added to the pass`,
        })
      }

      return result
    },
    idleExtras,
  )

  const isDone = plain.status === 'done' || settled.status === 'done'
  const isPending = plainPending || settlePending
  const error = settles
    ? settled.status === 'error'
      ? settled.message
      : undefined
    : plain.status === 'error'
      ? plain.message
      : undefined

  // Only reached when the card is still on screen after the list re-rendered.
  useEffect(() => {
    if (isDone) {
      onClose()
    }
  }, [isDone, onClose])

  function submit(event: FormEvent<HTMLFormElement>) {
    // Through a transition rather than `action=`: React 19 resets a form once
    // its action settles, which would empty the count and the bands on a
    // refusal.
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(() => (settles ? settleAction(formData) : plainAction(formData)))
  }

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{copy.title(booking.guestName)}</DialogTitle>
          <DialogDescription>
            {booking.reference} · {place}. Booked for {booked}.{' '}
            {move === 'check_in'
              ? 'The booking is marked as arrived now, under your name.'
              : 'Admitting uses the pass for today, under your name.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-lg">
          <input type="hidden" name="bookingId" value={booking.id} />

          {note ? <Notice>{note}</Notice> : null}

          <div className="grid gap-sm">
            <Label htmlFor="arrived-now">How many are here now?</Label>
            <Input
              id="arrived-now"
              name="arrived"
              type="number"
              inputMode="numeric"
              inputSize="touch"
              min={range.min}
              max={range.max}
              className="w-[120px] tabular-nums"
              value={countText}
              onChange={(event) => setCountText(event.target.value)}
            />
            {toCome > 0 ? (
              <p className="text-body-sm text-muted-foreground tabular-nums">
                {toCome} still to come. Count them in with Record arrivals when they get here.
              </p>
            ) : null}
          </div>

          {over > 0 && settles && passPricing && booking.passFigures ? (
            <SettleExtras
              booking={booking}
              config={passPricing}
              figures={booking.passFigures}
              extras={over}
              isPending={isPending}
              onTellOffice={() => setTellOfficeInstead(true)}
              onClose={onClose}
              error={error}
            />
          ) : (
            <>
              {notice ? <Notice>{notice}</Notice> : null}

              {toTell > 0 ? <ExtraGuestsRemark /> : null}

              {error ? <FieldError message={error} /> : null}

              <DialogFooter className={over > 0 && canSettle ? STACKED_FOOTER : undefined}>
                <Button type="button" variant="tertiary" size="touch" onClick={onClose}>
                  Not yet
                </Button>
                {over > 0 && canSettle ? (
                  <Button
                    type="button"
                    variant="tertiary"
                    size="touch"
                    onClick={() => setTellOfficeInstead(false)}
                  >
                    Take the money instead
                  </Button>
                ) : null}
                <Button type="submit" size="touch" disabled={valid === null || isPending}>
                  {isPending ? copy.pending : copy.label}
                </Button>
              </DialogFooter>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** The pass settle: who the extras are, what to take, and one press that admits them all. */
function SettleExtras({
  booking,
  config,
  figures,
  extras,
  isPending,
  onTellOffice,
  onClose,
  error,
}: {
  booking: GateBooking
  config: PropertyConfig
  figures: { total: number; paid: number }
  extras: number
  isPending: boolean
  onTellOffice: () => void
  onClose: () => void
  error: string | undefined
}) {
  const state = usePassExtras(booking, config, figures, extras)
  const take = state.take

  return (
    <>
      <input type="hidden" name="expectedTake" value={take ?? 0} />
      <input type="hidden" name="expectedHeadcount" value={booking.headcount ?? 0} />

      <PassExtrasFields config={config} extras={extras} state={state} />

      <ExtraGuestsRemark />

      {error ? <FieldError message={error} /> : null}

      <DialogFooter className={STACKED_FOOTER}>
        <Button type="button" variant="tertiary" size="touch" onClick={onClose}>
          Not yet
        </Button>
        <Button type="button" variant="tertiary" size="touch" onClick={onTellOffice}>
          Tell the office instead
        </Button>
        <Button type="submit" size="touch" disabled={take === null || take < 0 || isPending}>
          {isPending
            ? 'Recording…'
            : take !== null && take > 0
              ? `Take BND ${formatCents(take)} and admit`
              : 'Add them and admit'}
        </Button>
      </DialogFooter>
    </>
  )
}
