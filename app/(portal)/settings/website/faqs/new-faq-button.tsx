'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { FaqFacts } from '@/lib/domain/faq'

import { FaqEditorDialog } from './faq-editor-dialog'

/** The screen's one create action, and the editor it opens empty. */
export function NewFaqButton({ facts, featuredCount }: { facts: FaqFacts; featuredCount: number }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus aria-hidden />
        New FAQ
      </Button>
      {isOpen ? (
        <FaqEditorDialog
          facts={facts}
          featuredCount={featuredCount}
          onClose={() => setIsOpen(false)}
        />
      ) : null}
    </>
  )
}
