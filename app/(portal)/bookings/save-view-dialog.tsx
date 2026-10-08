'use client'

import { BookmarkPlus } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast-store'
import {
  MAX_VIEW_NAME_LENGTH,
  tidyViewName,
  type ViewFilter,
} from '@/lib/domain/booking-list-view'

import { saveBookingViewAction } from './view-actions'

/**
 * Saving what the list is filtered by as a view for the whole team
 * (capability B19).
 *
 * Offered only when there is something to save and no view already holds it.
 * One field, a name, because the filters are the ones on screen; the
 * description says where the view will appear and that everybody sees it,
 * which is the one thing about it a person might not expect. When dates are on
 * as well it says they are left out, rather than letting somebody save
 * "September" and find a view that shows every month.
 */
export function SaveViewDialog({ filter, hasDates }: { filter: ViewFilter; hasDates: boolean }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function close() {
    setOpen(false)
    setError(null)
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      const data = new FormData()

      data.set('name', name)
      filter.statuses.forEach((status) => data.append('status', status))
      filter.streams.forEach((stream) => data.append('stream', stream))
      data.set('search', filter.search ?? '')
      data.set('moneyOwed', String(filter.moneyOwed))

      try {
        const outcome = await saveBookingViewAction({ status: 'idle' }, data)

        if (outcome.status !== 'done') {
          setError(outcome.message ?? 'The view could not be saved.')
          return
        }
      } catch {
        setError('The view could not be saved. Check the connection and try again.')
        return
      }

      toast({ tone: 'positive', title: `“${tidyViewName(name)}” saved for everyone` })
      close()
      setName('')
    })
  }

  return (
    <>
      <Button type="button" variant="ghost" onClick={() => setOpen(true)}>
        <BookmarkPlus aria-hidden />
        Save view
      </Button>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="max-w-[440px]">
          <form onSubmit={save} className="grid gap-lg">
            <DialogHeader>
              <DialogTitle>Save this view</DialogTitle>
              <DialogDescription>
                It appears above the list for everyone who uses it, with the filters you have on now.
                {hasDates ? ' The dates are not saved — a view shows every date.' : null}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-sm">
              <Label htmlFor="view-name">Name</Label>
              <Input
                id="view-name"
                value={name}
                maxLength={MAX_VIEW_NAME_LENGTH}
                placeholder="e.g. Needs chasing"
                autoComplete="off"
                autoFocus
                aria-invalid={error ? true : undefined}
                onChange={(event) => setName(event.target.value)}
              />
              <FieldError message={error ?? undefined} />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="tertiary"
                onClick={close}
                disabled={isPending}
              >
                Not now
              </Button>
              <Button type="submit" disabled={isPending || name.trim() === ''}>
                {isPending ? 'Saving…' : 'Save view'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
