'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, Ticket, type LucideIcon } from 'lucide-react'

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
import { toast } from '@/components/ui/toast-store'
import { cn } from '@/lib/utils'

import { admitAtGateAction, checkInAtGateAction, type GateActionState } from './actions'

/**
 * The card's one move, confirmed: admitting a day pass, or checking a stay in.
 *
 * One confirming tap, because neither can be undone from this screen and a
 * thumb brushing a full-width button in a queue of cars is the ordinary way
 * to press the wrong one. The dialog names the guest and the place so the
 * guard reads what they are about to confirm.
 *
 * Both moves share this component because they have one shape — the button,
 * the dialog, one server action, a toast the moment it lands — and differ only
 * in their words and which action runs. Two copies would be the first to
 * disagree about the wrapper below.
 *
 * **No signal is a sentence, not a crash.** A server action that cannot reach
 * the server throws in the browser, and left alone that throw would replace
 * the screen with an error page at the barrier. So the call is wrapped: a
 * throw becomes a refusal saying nothing was recorded, which is true — the
 * write never arrived — and the guard can try again when a bar comes back.
 */

export type GateMove = 'check_in' | 'admit'

interface MoveCopy {
  label: string
  pending: string
  icon: LucideIcon
  action: (previous: GateActionState, formData: FormData) => Promise<GateActionState>
  title: (guestName: string) => string
  description: (reference: string, place: string) => string
  done: (guestName: string) => string
}

const MOVES: Readonly<Record<GateMove, MoveCopy>> = {
  check_in: {
    label: 'Check in',
    pending: 'Checking in…',
    icon: LogIn,
    action: checkInAtGateAction,
    title: (guestName) => `Check in ${guestName}?`,
    description: (reference, place) =>
      `${reference} · ${place}. The booking is marked as arrived now, under your name.`,
    done: (guestName) => `${guestName} is checked in`,
  },
  admit: {
    label: 'Admit',
    pending: 'Admitting…',
    icon: Ticket,
    action: admitAtGateAction,
    title: (guestName) => `Admit ${guestName}?`,
    description: (reference, place) =>
      `${reference} · ${place}. Check the number of people against the pass. Admitting uses it for today, under your name.`,
    done: (guestName) => `${guestName} is admitted`,
  },
}

const initialState: GateActionState = { status: 'idle' }

interface GateActionButtonProps {
  move: GateMove
  bookingId: string
  reference: string
  guestName: string
  /** The unit, or "Day pass · 3 people". */
  place: string
  className?: string
}

export function GateActionButton({ className, ...booking }: GateActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { icon: Icon, label } = MOVES[booking.move]

  return (
    <>
      <Button size="touch" className={cn('w-full', className)} onClick={() => setIsOpen(true)}>
        <Icon aria-hidden />
        {label}
      </Button>

      {/* Mounted only while open, so it opens with no stale refusal. */}
      {isOpen ? <GateActionDialog {...booking} onClose={() => setIsOpen(false)} /> : null}
    </>
  )
}

function GateActionDialog({
  move,
  bookingId,
  reference,
  guestName,
  place,
  onClose,
}: Omit<GateActionButtonProps, 'className'> & { onClose: () => void }) {
  const router = useRouter()
  const copy = MOVES[move]
  const [state, formAction, isPending] = useActionState(
    async (previous: GateActionState, formData: FormData): Promise<GateActionState> => {
      let result: GateActionState

      try {
        result = await copy.action(previous, formData)
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
          title: copy.done(result.guestName ?? guestName),
          description: `${reference} · ${place}`,
        })
      }

      return result
    },
    initialState,
  )

  // Only reached when the card is still on screen — a list that could not be
  // re-rendered, say. Everywhere else the card has already moved.
  useEffect(() => {
    if (state.status === 'done') {
      onClose()
      router.refresh()
    }
  }, [state.status, onClose, router])

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{copy.title(guestName)}</DialogTitle>
          <DialogDescription>{copy.description(reference, place)}</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-lg">
          <input type="hidden" name="bookingId" value={bookingId} />

          {state.status === 'error' ? <FieldError message={state.message} /> : null}

          <DialogFooter>
            <Button type="button" variant="tertiary" size="touch" onClick={onClose}>
              Not yet
            </Button>
            <Button type="submit" size="touch" disabled={isPending}>
              {isPending ? copy.pending : copy.label}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
