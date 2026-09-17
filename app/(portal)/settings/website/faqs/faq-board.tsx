'use client'

import { useState, useTransition } from 'react'
import { ArrowDown, ArrowUp, Check, Link2 } from 'lucide-react'

import { SectionCard } from '@/components/portal/section-card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/components/ui/toast-store'
import { MAX_FEATURED_FAQS, type FaqFacts, type FaqTopicId } from '@/lib/domain/faq'

import { moveFaqAction, setFaqFeaturedAction } from './actions'
import { FaqEditorDialog } from './faq-editor-dialog'
import { RemoveFaqDialog } from './remove-faq-dialog'

/** One FAQ as the list shows it. Plain data, built on the server. */
export interface FaqRowView {
  id: string
  slug: string
  /** The whole address, built from `SITE_ORIGIN` — what the row copies. */
  url: string
  topic: FaqTopicId
  question: string
  /** As written, figures in braces — what the editor opens on. */
  answer: string
  featured: boolean
  updatedAt: string
  /** The answer with its figures filled in, on one line. */
  preview: string
  /** Who changed it last, and when, in a sentence. */
  changed: string
}

export interface FaqTopicView {
  id: FaqTopicId
  title: string
  rows: readonly FaqRowView[]
}

/**
 * Every topic and the FAQs under it (capability F9).
 *
 * One client component for the whole list, so the live figures the editor
 * previews with cross to the browser once rather than once per row. A row
 * carries its quick moves inline — up, down, on the front page — because each
 * is a single click that needs no form; editing and removing open a dialog.
 */
export function FaqBoard({
  topics,
  facts,
  featuredCount,
}: {
  topics: readonly FaqTopicView[]
  facts: FaqFacts
  featuredCount: number
}) {
  const [open, setOpen] = useState<{ kind: 'edit' | 'remove'; row: FaqRowView } | null>(null)
  const close = () => setOpen(null)

  return (
    <>
      {topics.map((topic) => (
        <SectionCard key={topic.id} id={`faqs-${topic.id}`} title={topic.title}>
          {topic.rows.length > 0 ? (
            <ul className="divide-y divide-divider">
              {topic.rows.map((row, index) => (
                <FaqRow
                  key={row.id}
                  row={row}
                  isFirst={index === 0}
                  isLast={index === topic.rows.length - 1}
                  canFeature={row.featured || featuredCount < MAX_FEATURED_FAQS}
                  onEdit={() => setOpen({ kind: 'edit', row })}
                  onRemove={() => setOpen({ kind: 'remove', row })}
                />
              ))}
            </ul>
          ) : (
            <p className="text-body-sm text-muted-foreground">
              Nothing under this topic, so the FAQs page leaves it out.
            </p>
          )}
        </SectionCard>
      ))}

      {open?.kind === 'edit' ? (
        <FaqEditorDialog
          facts={facts}
          featuredCount={featuredCount}
          faq={open.row}
          onClose={close}
        />
      ) : null}
      {open?.kind === 'remove' ? <RemoveFaqDialog faq={open.row} onClose={close} /> : null}
    </>
  )
}

function FaqRow({
  row,
  isFirst,
  isLast,
  canFeature,
  onEdit,
  onRemove,
}: {
  row: FaqRowView
  isFirst: boolean
  isLast: boolean
  canFeature: boolean
  onEdit: () => void
  onRemove: () => void
}) {
  const [isPending, startTransition] = useTransition()

  function run(
    action: typeof moveFaqAction,
    fields: Record<string, string>,
    success?: string,
  ): void {
    startTransition(async () => {
      const data = new FormData()

      data.set('faqId', row.id)

      for (const [key, value] of Object.entries(fields)) {
        data.set(key, value)
      }

      const outcome = await action({ status: 'idle' }, data)

      if (outcome.status !== 'done') {
        toast({ tone: 'negative', title: outcome.message ?? 'That change could not be saved.' })
        return
      }

      if (success) {
        toast({ tone: 'positive', title: success })
      }
    })
  }

  const featureId = `faq-front-page-${row.id}`

  return (
    <li className="grid gap-sm py-md first:pt-0 last:pb-0 md:grid-cols-[1fr_auto] md:items-start md:gap-xl">
      <div className="min-w-0">
        <p className="text-body-md-strong text-foreground">{row.question}</p>
        <p className="mt-xxs line-clamp-2 text-body-sm text-copy">{row.preview}</p>
        <p className="mt-xxs text-caption text-muted-foreground">
          <CopyAddress row={row} /> · {row.changed}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-xs">
        <label
          htmlFor={featureId}
          title={canFeature ? undefined : `The front page already shows ${MAX_FEATURED_FAQS}.`}
          className="mr-sm flex items-center gap-xs text-body-sm text-foreground"
        >
          <Checkbox
            id={featureId}
            checked={row.featured}
            disabled={isPending || !canFeature}
            onCheckedChange={(checked) =>
              run(
                setFaqFeaturedAction,
                { featured: checked === true ? 'true' : 'false' },
                checked === true ? 'On the front page' : 'Taken off the front page',
              )
            }
          />
          Front page
        </label>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Move “${row.question}” up`}
          disabled={isPending || isFirst}
          onClick={() => run(moveFaqAction, { direction: 'up' })}
        >
          <ArrowUp aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Move “${row.question}” down`}
          disabled={isPending || isLast}
          onClick={() => run(moveFaqAction, { direction: 'down' })}
        >
          <ArrowDown aria-hidden />
        </Button>
        <Button variant="tertiary" onClick={onEdit} disabled={isPending}>
          Edit
        </Button>
        <Button variant="destructive-tertiary" onClick={onRemove} disabled={isPending}>
          Remove
        </Button>
      </div>
    </li>
  )
}

/** How long the row says "Copied" before going back to the address. */
const COPIED_FEEDBACK_MS = 2000

/**
 * The answer's address, and the one thing staff want to do with it.
 *
 * It printed `/faq#day-pass-what-to-bring` and stopped there, which advertised
 * a feature it did not deliver: the whole point of freezing a slug when a FAQ
 * is added is that staff can send one answer over WhatsApp, and a bare
 * fragment is not something anybody can send. Assembling it by hand meant
 * knowing the site's host — which is not the host this screen is served from
 * once staff move to their own subdomain — and retyping the slug on a phone.
 *
 * So the address is the control. It copies the absolute URL, and says so for
 * a moment afterwards; the clipboard is the whole interaction, which is why it
 * is a button rather than a link to somewhere staff did not ask to go. The
 * tab's own "View the FAQs page" is there for looking.
 *
 * Quiet by construction: caption-sized, mute, a dotted underline to say it is
 * pressable without becoming a second blue link in a list of twenty rows, and
 * ink on hover — the operations surface's only emphasis (design.md).
 */
function CopyAddress({ row }: { row: FaqRowView }) {
  const [isCopied, setIsCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(row.url)
      setIsCopied(true)
      window.setTimeout(() => setIsCopied(false), COPIED_FEEDBACK_MS)
    } catch {
      // Clipboard refused — an insecure context, or a browser that asks. The
      // address is still on screen and still selectable, so nothing is lost
      // and a toast about a copy that failed would be noise on a row.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy ${row.url}`}
      aria-label={isCopied ? 'Link copied' : `Copy the link to "${row.question}"`}
      className="inline-flex items-center gap-xxs rounded-md font-mono underline decoration-dotted underline-offset-2 transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      {isCopied ? (
        <Check aria-hidden className="size-3" />
      ) : (
        <Link2 aria-hidden className="size-3" />
      )}
      {isCopied ? 'Link copied' : `/faq#${row.slug}`}
    </button>
  )
}
