'use client'

import { useActionState, useEffect, useState } from 'react'
import { LogIn, LogOut, Ticket, type LucideIcon } from 'lucide-react'

import { DID_NOT_GO_THROUGH } from '@/components/field/did-not-go-through'
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
import { Notice } from '@/components/ui/notice'
import { toast } from '@/components/ui/toast-store'
import type { GateBooking } from '@/lib/db/gate'
import type { PropertyConfig } from '@/lib/domain/config'
import { cn } from '@/lib/utils'

import { checkOutAtGateAction, type GateActionState } from './actions'
import { GateCountDialog } from './gate-count-dialog'

/**
 * The card's one move, confirmed: checking a stay in, checking it out, or
 * admitting a day pass.
 *
 * One confirming tap, because none of them can be undone from this screen and a
 * thumb brushing a full-width button in a queue of cars is the ordinary way to
 * press the wrong one. The dialog names the guest and the place so the guard
 * reads what he is about to confirm, and says anything he should know first —
 * a stay still owed, say — before he does.
 *
 * **Checking in and admitting count the guests in** (capability D8): their
 * dialog asks how many are here now (gate-count-dialog.tsx). Checking out asks
 * nothing but the confirmation.
 *
 * **No signal is a sentence, not a crash.** A server action that cannot reach
 * the server throws in the browser, and left alone that throw would replace
 * the screen with an error page at the barrier. So the call is wrapped: a
 * throw becomes a refusal saying nothing was recorded, which is true — the
 * write never arrived — and the guard can try again when a bar comes back.
 */

export type GateMove = 'check_in' | 'check_out' | 'admit'

const ICONS: Readonly<Record<GateMove, LucideIcon>> = {
  check_in: LogIn,
  check_out: LogOut,
  admit: Ticket,
}

const LABELS: Readonly<Record<GateMove, string>> = {
  check_in: 'Check in',
  check_out: 'Check out',
  admit: 'Admit',
}

const initialState: GateActionState = { status: 'idle' }

interface GateActionButtonProps {
  move: GateMove
  booking: GateBooking
  /** The unit, or "Day pass". */
  place: string
  /** Said in the dialog before the guard confirms, when there is something to know. */
  note?: string
  /** Whether the reader takes cash — offered the pass settle only if so. */
  takesCash: boolean
  /** The pass rates, for a reader who may add visitors to a pass and take the cash. */
  passPricing: PropertyConfig | null
  className?: string
}

export function GateActionButton({ className, ...props }: GateActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const Icon = ICONS[props.move]
  const close = () => setIsOpen(false)

  return (
    <>
      <Button size="touch" className={cn('w-full', className)} onClick={() => setIsOpen(true)}>
        <Icon aria-hidden />
        {LABELS[props.move]}
      </Button>

      {/* Mounted only while open, so it opens on the card as it is now, with no stale refusal. */}
      {isOpen ? (
        props.move === 'check_out' ? (
          <CheckOutDialog
            booking={props.booking}
            place={props.place}
            note={props.note}
            onClose={close}
          />
        ) : (
          <GateCountDialog
            move={props.move}
            booking={props.booking}
            note={props.note}
            takesCash={props.takesCash}
            passPricing={props.passPricing}
            onClose={close}
          />
        )
      ) : null}
    </>
  )
}

function CheckOutDialog({
  booking,
  place,
  note,
  onClose,
}: {
  booking: GateBooking
  place: string
  note?: string
  onClose: () => void
}) {
  const [state, formAction, isPending] = useActionState(
    async (previous: GateActionState, formData: FormData): Promise<GateActionState> => {
      let result: GateActionState

      try {
        result = await checkOutAtGateAction(previous, formData)
      } catch {
        return { status: 'error', message: DID_NOT_GO_THROUGH }
      }

      // Said here, the moment the server answers, and not from an effect. The
      // same response re-renders the list with this card moved, which
      // unmounts it — and this dialog with it — before an effect would ever
      // run, so the guard would get no confirmation at all. The toast queue
      // lives outside the tree, so it survives the unmount.
      if (result.status === 'done') {
        toast({
          tone: 'positive',
          title: `${result.guestName ?? booking.guestName} is checked out`,
          description: `${booking.reference} · ${place}`,
        })
      }

      return result
    },
    initialState,
  )

  // Only reached when the card is still on screen. The action's response has
  // already re-rendered the list, so all that is left here is the dialog.
  useEffect(() => {
    if (state.status === 'done') {
      onClose()
    }
  }, [state.status, onClose])

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Check out {booking.guestName}?</DialogTitle>
          <DialogDescription>
            {booking.reference} · {place}. Take the keys back first. They are checked out now, under
            your name, and the unit moves to inspection.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-lg">
          <input type="hidden" name="bookingId" value={booking.id} />

          {note ? <Notice>{note}</Notice> : null}

          {state.status === 'error' ? <FieldError message={state.message} /> : null}

          <DialogFooter>
            <Button type="button" variant="tertiary" size="touch" onClick={onClose}>
              Not yet
            </Button>
            <Button type="submit" size="touch" disabled={isPending}>
              {isPending ? 'Checking out…' : 'Check out'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
