'use client'

import { useActionState, useEffect, useState } from 'react'
import { Ticket } from 'lucide-react'

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
import { formatStayDate } from '@/lib/domain/dates'

import { admitAction, type PassActionState } from './pass-actions'

/**
 * Admitting a day pass at the desk (N54) — a pass's forward action, as Check
 * in is a stay's.
 *
 * It exists only when the state machine allows the move (the caller asks), so
 * it takes the screen's one primary fill for the reason `StayButtons` does.
 * Its dialog says before the click the two things that would refuse it — a
 * pass for another day, and money still owed — and names the way out rather
 * than offering a button that will be refused. `admit_day_pass()` refuses the
 * same two last, under the lock, for the clerk whose colleague moved the
 * booking a second after the dialog opened.
 */

const initialState: PassActionState = { status: 'idle' }

interface AdmitPassButtonProps {
  bookingId: string
  reference: string
  guestName: string
  passDate: string
  headcount: number
  /** Today, in the property's timezone — resolved on the server. */
  today: string
  /** Whether verified payments fall short of the pass's total. */
  isOwed: boolean
}

export function AdmitPassButton(props: AdmitPassButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Ticket aria-hidden />
        Admit
      </Button>

      {/* Mounted only while open, so it opens with fresh action state. */}
      {isOpen ? <AdmitPassDialog {...props} onClose={() => setIsOpen(false)} /> : null}
    </>
  )
}

function AdmitPassDialog({
  bookingId,
  reference,
  guestName,
  passDate,
  headcount,
  today,
  isOwed,
  onClose,
}: AdmitPassButtonProps & { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(
    async (previous: PassActionState, formData: FormData): Promise<PassActionState> => {
      const result = await admitAction(previous, formData)

      // Said here, the moment the server answers, and not from an effect. The
      // same response re-renders the page with the booking closed, which
      // removes this button — and this dialog with it — before an effect would
      // ever run; the gate's GateActionButton meets the same thing. The toast
      // queue lives outside the tree, so it survives the unmount.
      if (result.status === 'done') {
        toast({
          tone: 'positive',
          title: `${reference} admitted`,
          description: 'The day pass is used for today, and the booking is closed.',
        })
      }

      return result
    },
    initialState,
  )

  const isItsDay = passDate === today
  const canProceed = isItsDay && !isOwed

  // Only reached when the dialog is still mounted. The action's response has
  // already re-rendered the page, so all that is left here is the dialog.
  useEffect(() => {
    if (state.status === 'done') {
      onClose()
    }
  }, [state.status, onClose])

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Admit {guestName}?</DialogTitle>
          <DialogDescription>
            A day pass for {headcount} {headcount === 1 ? 'person' : 'people'} on{' '}
            {formatStayDate(passDate)}. Admitting uses it for the day and closes the booking — it
            cannot be edited or cancelled afterwards.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-lg">
          <input type="hidden" name="bookingId" value={bookingId} />

          {!isItsDay ? (
            <Notice>
              This pass is for {formatStayDate(passDate)}, and can only be admitted on that day.
            </Notice>
          ) : null}

          {isItsDay && isOwed ? (
            <Notice>
              This pass is not paid in full. Take the rest from the Money card below, then admit it.
            </Notice>
          ) : null}

          {state.status === 'error' ? <FieldError message={state.message} /> : null}

          <DialogFooter>
            <Button type="button" variant="tertiary" onClick={onClose}>
              {canProceed ? 'Not yet' : 'Close'}
            </Button>
            {canProceed ? (
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Admitting…' : `Admit ${reference}`}
              </Button>
            ) : null}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
