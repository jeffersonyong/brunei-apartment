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

/**
 * Replacing written text with the template (capability F10). Asked only when
 * there is text to lose; an empty editor takes the template straight away.
 */
export function UseTemplateDialog({
  onUseTemplate,
  onClose,
}: {
  onUseTemplate: () => void
  onClose: () => void
}) {
  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Replace your text with the template?</DialogTitle>
          <DialogDescription>
            What is in the editor is replaced. Your saved draft and the website stay as they are
            until you save or publish, and Discard changes brings the saved draft back.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="tertiary" onClick={onClose}>
            Keep my text
          </Button>
          <Button type="button" onClick={onUseTemplate}>
            Use the template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
