'use client'

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

/**
 * Putting the privacy policy on the website (capability F10).
 *
 * The confirmation design.md asks for: plain sentences about what happens —
 * where it appears, what the first one switches on, what becomes of the
 * version it replaces — and the one thing only the reader can check, that the
 * wording has been approved.
 */
export function PublishPrivacyPolicyDialog({
  isFirst,
  isPending,
  error,
  onPublish,
  onClose,
}: {
  /** Nothing has been published before, so the footer link is inert until this. */
  isFirst: boolean
  isPending: boolean
  error: string | null
  onPublish: () => void
  onClose: () => void
}) {
  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isFirst ? 'Publish the privacy policy?' : 'Publish this version?'}
          </DialogTitle>
          <DialogDescription>
            {isFirst
              ? 'It goes on the website straight away, and the Privacy policy link at the foot of every page starts working. Guests sending us their IC are pointed to it too.'
              : 'It replaces the version the website shows now, straight away. The earlier version is kept in the list of published versions.'}
          </DialogDescription>
        </DialogHeader>

        <p className="text-body-sm text-foreground">
          The website shows exactly what you publish, so check the wording has been approved.
        </p>

        {error ? <FieldError message={error} /> : null}

        <DialogFooter>
          <Button type="button" variant="tertiary" onClick={onClose}>
            Not yet
          </Button>
          <Button type="button" onClick={onPublish} disabled={isPending}>
            {isPending ? 'Publishing…' : 'Publish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
