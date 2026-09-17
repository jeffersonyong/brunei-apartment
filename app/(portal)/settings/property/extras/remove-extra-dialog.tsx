'use client'

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
import type { PropertyExtra } from '@/lib/domain/extras'

import { removeExtraAction } from './actions'

/**
 * Taking an extra off the list (capability F13).
 *
 * The confirmation design.md asks for: plain sentences about what actually
 * happens, with the safe choice worded as the thing itself.
 *
 * What it says is true and worth saying — **removing does not delete**. A
 * booking that has one keeps it, on its receipt and in the count that stops it
 * being sold twice, because a sofa bed in somebody's room tonight is still in
 * somebody's room tonight. It can be put back, which is why nothing here warns
 * that the action cannot be undone.
 */
export function RemoveExtraDialog({
  extra,
  onClose,
}: {
  extra: PropertyExtra
  onClose: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function remove() {
    setError(null)

    startTransition(async () => {
      const data = new FormData()

      data.set('extraId', extra.id)

      const outcome = await removeExtraAction({ status: 'idle' }, data)

      if (outcome.status !== 'done') {
        setError(outcome.message ?? 'That extra could not be removed.')
        return
      }

      toast({ tone: 'positive', title: `${extra.name} removed` })
      onClose()
    })
  }

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Remove {extra.name.toLowerCase()}?</DialogTitle>
          <DialogDescription>
            It comes off the booking forms, so nobody can add one from now on. Bookings that already
            have one keep it and are still charged what they were quoted. You can put it back from
            the removed list.
          </DialogDescription>
        </DialogHeader>

        {error ? <FieldError message={error} /> : null}

        <DialogFooter>
          <Button type="button" variant="tertiary" onClick={onClose} disabled={isPending}>
            Keep it
          </Button>
          <Button type="button" variant="destructive" onClick={remove} disabled={isPending}>
            {isPending ? 'Removing…' : 'Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
