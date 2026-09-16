'use client'

import { useActionState, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

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

import { replaceEntryCodeAction, type EntryCodeActionState } from './entry-code-actions'

/**
 * Replace code, confirmed.
 *
 * Tertiary on the section's title line, never a primary: it is the exception
 * for a code that has gone somewhere it should not, and the screen's one fill
 * belongs to what moves the booking. The dialog says the one consequence that
 * matters before the click — the guest's copy stops working too — because that
 * is the half somebody would otherwise find out about at the gate.
 */

const initialState: EntryCodeActionState = { status: 'idle' }

export function ReplaceEntryCodeButton({
  bookingId,
  reference,
}: {
  bookingId: string
  reference: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button variant="tertiary" onClick={() => setIsOpen(true)}>
        <RefreshCw aria-hidden />
        Replace code
      </Button>

      {/* Mounted only while open, so it opens with no stale refusal. */}
      {isOpen ? (
        <ReplaceEntryCodeDialog
          bookingId={bookingId}
          reference={reference}
          onClose={() => setIsOpen(false)}
        />
      ) : null}
    </>
  )
}

function ReplaceEntryCodeDialog({
  bookingId,
  reference,
  onClose,
}: {
  bookingId: string
  reference: string
  onClose: () => void
}) {
  const [state, formAction, isPending] = useActionState(
    async (previous: EntryCodeActionState, formData: FormData): Promise<EntryCodeActionState> => {
      const result = await replaceEntryCodeAction(previous, formData)

      if (result.status === 'done') {
        toast({
          tone: 'positive',
          title: `New entry code for ${reference}`,
          description: 'Download it and send it to the guest. The old one no longer works.',
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
          <DialogTitle>Replace the entry code for {reference}?</DialogTitle>
          <DialogDescription>
            The current code stops working at once — including the one in the guest&rsquo;s
            confirmation email and any copy already forwarded. Send the guest the new code
            afterwards.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-lg">
          <input type="hidden" name="bookingId" value={bookingId} />

          {state.status === 'error' ? <FieldError message={state.message} /> : null}

          <DialogFooter>
            <Button type="button" variant="tertiary" onClick={onClose}>
              Keep this code
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Replacing…' : 'Replace code'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
