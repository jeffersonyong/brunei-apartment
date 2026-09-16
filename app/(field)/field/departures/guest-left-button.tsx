'use client'

import { useActionState, useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'

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

import { guestHasLeftAction, type TurnoverActionState } from './actions'

/**
 * "Guest has left", confirmed (D-2).
 *
 * The cleaner finds the unit empty on the guest's last day and says so, which
 * checks the guest out. Confirmed because a check-out cannot be undone from a
 * phone, and the dialog names the guest and the door so the cleaner reads what
 * they are confirming. The card offers this only for a guest due out today or
 * overdue (lib/domain/turnover.ts); the action decides that again.
 */

const initialState: TurnoverActionState = { status: 'idle' }

interface GuestLeftButtonProps {
  bookingId: string
  reference: string
  guestName: string
  unitRef: string
  className?: string
}

export function GuestLeftButton({ className, ...stay }: GuestLeftButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button size="touch" className={cn('w-full', className)} onClick={() => setIsOpen(true)}>
        <LogOut aria-hidden />
        Guest has left
      </Button>

      {isOpen ? <GuestLeftDialog {...stay} onClose={() => setIsOpen(false)} /> : null}
    </>
  )
}

function GuestLeftDialog({
  bookingId,
  reference,
  guestName,
  unitRef,
  onClose,
}: Omit<GuestLeftButtonProps, 'className'> & { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(
    async (previous: TurnoverActionState, formData: FormData): Promise<TurnoverActionState> => {
      let result: TurnoverActionState

      try {
        result = await guestHasLeftAction(previous, formData)
      } catch {
        return { status: 'error', message: DID_NOT_GO_THROUGH }
      }

      // Here and not from an effect: the response moves this card from
      // "Leaving today" to "To inspect", unmounting the dialog before an effect
      // would run (check-in-button.tsx has the same note).
      if (result.status === 'done') {
        toast({
          tone: 'positive',
          title: `${guestName} is checked out`,
          description: `${unitRef} is ready to inspect.`,
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

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Has {guestName} left?</DialogTitle>
          <DialogDescription>
            {unitRef} · {reference}. The guest is checked out now, under your name, and the unit
            moves to inspection.
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
              {isPending ? 'Checking out…' : 'Guest has left'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
