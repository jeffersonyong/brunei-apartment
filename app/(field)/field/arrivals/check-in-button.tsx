'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn } from 'lucide-react'

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

import { checkInAtGateAction, type GateCheckInState } from './actions'

/**
 * Check in, confirmed.
 *
 * One confirming tap, because a check-in cannot be undone from this screen and
 * a thumb brushing a full-width button in a queue of cars is the ordinary way
 * to press the wrong one. The dialog names the guest and the door so the guard
 * reads what they are about to confirm.
 *
 * **No signal is a sentence, not a crash.** A server action that cannot reach
 * the server throws in the browser, and left alone that throw would replace
 * the screen with an error page at the barrier. So the call is wrapped: a
 * throw becomes a refusal saying nothing was recorded, which is true — the
 * write never arrived — and the guard can try again when a bar comes back.
 */

const initialState: GateCheckInState = { status: 'idle' }

interface CheckInButtonProps {
  bookingId: string
  reference: string
  guestName: string
  /** The unit, or "Day pass · 3 people". */
  place: string
  className?: string
}

export function CheckInButton({ className, ...booking }: CheckInButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button size="touch" className={cn('w-full', className)} onClick={() => setIsOpen(true)}>
        <LogIn aria-hidden />
        Check in
      </Button>

      {/* Mounted only while open, so it opens with no stale refusal. */}
      {isOpen ? <CheckInDialog {...booking} onClose={() => setIsOpen(false)} /> : null}
    </>
  )
}

async function checkInOrSayWhy(
  previous: GateCheckInState,
  formData: FormData,
): Promise<GateCheckInState> {
  try {
    return await checkInAtGateAction(previous, formData)
  } catch {
    return { status: 'error', message: DID_NOT_GO_THROUGH }
  }
}

function CheckInDialog({
  bookingId,
  reference,
  guestName,
  place,
  onClose,
}: Omit<CheckInButtonProps, 'className'> & { onClose: () => void }) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    async (previous: GateCheckInState, formData: FormData): Promise<GateCheckInState> => {
      const result = await checkInOrSayWhy(previous, formData)

      // Said here, the moment the server answers, and not from an effect. The
      // same response re-renders the list with this guest under "Already in",
      // which unmounts this card — and this dialog with it — before an effect
      // would ever run, so the guard would get no confirmation at all. The
      // toast queue lives outside the tree, so it survives the unmount.
      if (result.status === 'done') {
        toast({
          tone: 'positive',
          title: `${result.guestName ?? guestName} is checked in`,
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
          <DialogTitle>Check in {guestName}?</DialogTitle>
          <DialogDescription>
            {reference} · {place}. The booking is marked as arrived now, under your name.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-lg">
          <input type="hidden" name="bookingId" value={bookingId} />

          {state.status === 'error' ? <FieldError message={state.message} /> : null}

          <DialogFooter>
            <Button type="button" variant="tertiary" size="touch" onClick={onClose}>
              Not yet
            </Button>
            <Button type="submit" size="touch" disabled={isPending}>
              {isPending ? 'Checking in…' : 'Check in'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
