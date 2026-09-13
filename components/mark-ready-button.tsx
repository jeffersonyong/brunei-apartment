'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'

import {
  markUnitReadyAction,
  type UnitActionState,
} from '@/app/(portal)/portal/units/[ref]/actions'
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

/**
 * Mark ready, confirmed (capability C3).
 *
 * Shared by the cleaner's phone and the unit's page in the portal, which is
 * why it sits outside both: one confirmation, one sentence about what it means,
 * whichever screen it is pressed on.
 *
 * Confirmed because it is written once and has no undo in v1 [A], and a thumb
 * on a full-width button is how the wrong unit gets marked. The dialog says
 * what the mark does and what it does not: it tells the office the unit is
 * clean, and it changes nothing about selling or checking in (D-3).
 */

const initialState: UnitActionState = { status: 'idle' }

interface MarkReadyButtonProps {
  bookingId: string
  unitRef: string
  /** The stay the unit is being made ready after. */
  reference: string
  /** `touch` on the field surface; the portal's own size elsewhere. */
  size?: 'touch' | 'default'
  className?: string
}

export function MarkReadyButton({ className, size = 'default', ...stay }: MarkReadyButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        size={size}
        className={cn(size === 'touch' && 'w-full', className)}
        onClick={() => setIsOpen(true)}
      >
        <Sparkles aria-hidden />
        Mark ready
      </Button>

      {/* Mounted only while open, so it opens with no stale refusal. */}
      {isOpen ? <MarkReadyDialog {...stay} size={size} onClose={() => setIsOpen(false)} /> : null}
    </>
  )
}

function MarkReadyDialog({
  bookingId,
  unitRef,
  reference,
  size,
  onClose,
}: Omit<MarkReadyButtonProps, 'className'> & { onClose: () => void }) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    async (previous: UnitActionState, formData: FormData): Promise<UnitActionState> => {
      let result: UnitActionState

      try {
        result = await markUnitReadyAction(previous, formData)
      } catch {
        return { status: 'error', message: DID_NOT_GO_THROUGH }
      }

      // Said here, the moment the server answers, and not from an effect: the
      // same response re-renders the list without this unit, which unmounts the
      // card and this dialog with it before an effect would run. The toast
      // queue lives outside the tree, so it survives.
      if (result.status === 'done') {
        toast({
          tone: 'positive',
          title: `${unitRef} is ready`,
          description: `Marked ready after ${reference}.`,
        })
      }

      return result
    },
    initialState,
  )

  // Only reached when the button is still on screen — the portal's unit page,
  // which keeps the section and shows the mark.
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
          <DialogTitle>Mark {unitRef} ready?</DialogTitle>
          <DialogDescription>
            This tells the office {unitRef} is clean after {reference}, under your name. It cannot
            be undone, and it does not change who can be booked into the unit.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-lg">
          <input type="hidden" name="bookingId" value={bookingId} />

          {state.status === 'error' ? <FieldError message={state.message} /> : null}

          <DialogFooter>
            <Button type="button" variant="tertiary" size={size} onClick={onClose}>
              Not yet
            </Button>
            <Button type="submit" size={size} disabled={isPending}>
              {isPending ? 'Marking…' : 'Mark ready'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
