'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

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

import { removeFaqAction } from './actions'
import type { FaqRowView } from './faq-board'

/**
 * Taking a FAQ off the website (capability F9).
 *
 * The confirmation design.md asks for: plain sentences about what will happen —
 * where it disappears from, what a link to it does now, and that the record
 * stays — with the safe choice worded as the thing itself.
 */
export function RemoveFaqDialog({ faq, onClose }: { faq: FaqRowView; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function remove() {
    setError(null)

    startTransition(async () => {
      const data = new FormData()

      data.set('faqId', faq.id)

      const outcome = await removeFaqAction({ status: 'idle' }, data)

      if (outcome.status !== 'done') {
        setError(outcome.message ?? 'That FAQ could not be removed.')
        return
      }

      toast({ tone: 'positive', title: 'FAQ removed' })
      onClose()
      router.refresh()
    })
  }

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Take this FAQ off the website?</DialogTitle>
          <DialogDescription>
            &ldquo;{faq.question}&rdquo; comes off the FAQs page
            {faq.featured ? ' and the front page' : ''}, and a link somebody was sent to it opens
            the top of the FAQs page instead. What it said stays in the audit log.
          </DialogDescription>
        </DialogHeader>

        {error ? <FieldError message={error} /> : null}

        <DialogFooter>
          <Button type="button" variant="tertiary" onClick={onClose}>
            Keep FAQ
          </Button>
          <Button type="button" variant="destructive" onClick={remove} disabled={isPending}>
            {isPending ? 'Removing…' : 'Remove FAQ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
