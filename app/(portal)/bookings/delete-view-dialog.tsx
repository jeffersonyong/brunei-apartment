'use client'

import { Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'

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

import { deleteBookingViewAction } from './view-actions'

/**
 * Deleting the view the list is showing (capability B19).
 *
 * Anyone who can see the list may delete any view (Jeff, 8 October 2026), so
 * the confirmation says plainly who loses it — everyone — and what does not
 * change: no booking. The list is left showing the same bookings it was, now
 * as an unnamed filter, so nothing on screen jumps.
 */
export function DeleteViewDialog({ viewId, name }: { viewId: string; name: string }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function close() {
    setOpen(false)
    setError(null)
  }

  function remove() {
    setError(null)

    startTransition(async () => {
      const data = new FormData()

      data.set('viewId', viewId)

      try {
        const outcome = await deleteBookingViewAction({ status: 'idle' }, data)

        if (outcome.status !== 'done') {
          setError(outcome.message ?? 'The view could not be deleted.')
          return
        }
      } catch {
        setError('The view could not be deleted. Check the connection and try again.')
        return
      }

      toast({ tone: 'positive', title: `“${name}” deleted` })
      close()
    })
  }

  return (
    <>
      <Button type="button" variant="ghost" onClick={() => setOpen(true)}>
        <Trash2 aria-hidden />
        Delete view
      </Button>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Delete the &ldquo;{name}&rdquo; view?</DialogTitle>
            <DialogDescription>
              It disappears for everyone who uses this list. No booking is changed.
            </DialogDescription>
          </DialogHeader>

          {error ? <FieldError message={error} /> : null}

          <DialogFooter>
            <Button
              type="button"
              variant="tertiary"
              onClick={close}
              disabled={isPending}
            >
              Keep it
            </Button>
            <Button type="button" variant="destructive" onClick={remove} disabled={isPending}>
              {isPending ? 'Deleting…' : 'Delete view'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
