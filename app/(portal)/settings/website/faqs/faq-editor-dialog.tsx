'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Braces, ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Notice } from '@/components/ui/notice'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast-store'
import {
  FAQ_FIGURES,
  FAQ_TOPICS,
  MAX_FEATURED_FAQS,
  figureToken,
  renderFaqAnswer,
  typedMoneyFigures,
  type FaqFacts,
  type FaqTopicId,
} from '@/lib/domain/faq'

import { addFaqAction, updateFaqAction, type FaqActionState } from './actions'
import type { FaqRowView } from './faq-board'

/**
 * Writing a FAQ, new or existing (capability F9).
 *
 * **The answer is plain text with live figures in it.** "Insert live figure"
 * puts `{security deposit}` at the cursor, and the preview beside it shows the
 * sentence as a guest will read it, with today's figure filled in — which is
 * how somebody who has never seen a brace in their life can tell the figure
 * is doing its job. An amount typed in by hand is pointed out under the field
 * rather than refused: it is the one that goes stale when a rate changes, and
 * sometimes it is exactly what was meant.
 *
 * **Save is dirty-gated when editing** (design.md, Buttons), and always enabled
 * when adding. A refusal stays in the dialog, under the field it is about.
 */
export function FaqEditorDialog({
  facts,
  featuredCount,
  faq,
  onClose,
}: {
  facts: FaqFacts
  featuredCount: number
  /** Absent when adding. */
  faq?: FaqRowView
  onClose: () => void
}) {
  const [topic, setTopic] = useState<FaqTopicId>(faq?.topic ?? FAQ_TOPICS[0].id)
  const [question, setQuestion] = useState(faq?.question ?? '')
  const [answer, setAnswer] = useState(faq?.answer ?? '')
  const [featured, setFeatured] = useState(faq?.featured ?? false)
  const [result, setResult] = useState<FaqActionState>({ status: 'idle' })
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const answerRef = useRef<HTMLTextAreaElement>(null)
  // Where the cursor was when the answer lost focus to the figure menu, and
  // where it should land once the figure is in.
  const selection = useRef({ start: answer.length, end: answer.length })
  const caretAfterInsert = useRef<number | null>(null)

  const isEditing = faq !== undefined
  const isDirty =
    !isEditing ||
    topic !== faq.topic ||
    question.trim() !== faq.question ||
    answer.trim() !== faq.answer ||
    featured !== faq.featured
  const canFeature = featured || featuredCount < MAX_FEATURED_FAQS || faq?.featured === true
  const typed = typedMoneyFigures(answer)
  const preview = renderFaqAnswer(answer, facts)

  function rememberSelection() {
    const field = answerRef.current

    if (field) {
      selection.current = { start: field.selectionStart, end: field.selectionEnd }
    }
  }

  function insertFigure(token: string) {
    const { start, end } = selection.current
    const next = `${answer.slice(0, start)}${token}${answer.slice(end)}`

    setAnswer(next)
    caretAfterInsert.current = start + token.length
    selection.current = { start: start + token.length, end: start + token.length }
  }

  function returnToAnswer(event: Event) {
    const field = answerRef.current
    const caret = caretAfterInsert.current

    if (!field || caret === null) {
      return
    }

    // Back to the answer, with the cursor after what was inserted, rather than
    // to the menu's trigger: the next thing somebody does is keep typing.
    event.preventDefault()
    caretAfterInsert.current = null
    field.focus()
    field.setSelectionRange(caret, caret)
  }

  function save() {
    startTransition(async () => {
      const data = new FormData()

      data.set('topic', topic)
      data.set('question', question)
      data.set('answer', answer)
      data.set('featured', featured ? 'true' : 'false')

      if (faq) {
        data.set('faqId', faq.id)
        data.set('expectedUpdatedAt', faq.updatedAt)
      }

      const outcome = faq
        ? await updateFaqAction({ status: 'idle' }, data)
        : await addFaqAction({ status: 'idle' }, data)

      if (outcome.status !== 'done') {
        setResult(outcome)
        return
      }

      toast({ tone: 'positive', title: faq ? 'FAQ saved' : 'FAQ added' })
      onClose()
      router.refresh()
    })
  }

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[640px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{faq ? 'Edit FAQ' : 'New FAQ'}</DialogTitle>
          <DialogDescription>
            It goes live on the FAQs page as soon as it is saved.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-lg">
          <div className="grid content-start gap-sm">
            <Label htmlFor="faq-topic">Topic</Label>
            <Select
              value={topic}
              onValueChange={(value) => setTopic(value as FaqTopicId)}
              disabled={isPending}
            >
              <SelectTrigger
                id="faq-topic"
                className="w-full max-w-[320px]"
                aria-invalid={result.fieldErrors?.topic ? true : undefined}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FAQ_TOPICS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={result.fieldErrors?.topic} />
          </div>

          <div className="grid content-start gap-sm">
            <Label htmlFor="faq-question">Question</Label>
            <Input
              id="faq-question"
              value={question}
              placeholder="Can we bring our own food?"
              disabled={isPending}
              aria-invalid={result.fieldErrors?.question ? true : undefined}
              onChange={(event) => setQuestion(event.target.value)}
            />
            <FieldError message={result.fieldErrors?.question} />
          </div>

          <div className="grid content-start gap-sm">
            <div className="flex flex-wrap items-end justify-between gap-sm">
              <Label htmlFor="faq-answer">Answer</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="tertiary" className="group" disabled={isPending}>
                    <Braces aria-hidden />
                    Insert live figure
                    <ChevronDown
                      aria-hidden
                      className="transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="max-h-[320px] w-[320px] overflow-y-auto"
                  onCloseAutoFocus={returnToAnswer}
                >
                  {FAQ_FIGURES.map((figure) => (
                    <DropdownMenuItem
                      key={figure.key}
                      className="flex-col items-start gap-xxs"
                      onSelect={() => insertFigure(figureToken(figure))}
                    >
                      <span className="text-body-sm text-foreground">{figure.label}</span>
                      <span className="line-clamp-1 text-caption text-muted-foreground">
                        Now: {figure.render(facts)}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Textarea
              id="faq-answer"
              ref={answerRef}
              value={answer}
              rows={5}
              placeholder="Yes — there is a picnic area beside the pool."
              disabled={isPending}
              aria-invalid={result.fieldErrors?.answer ? true : undefined}
              aria-describedby="faq-answer-hint"
              onChange={(event) => setAnswer(event.target.value)}
              onSelect={rememberSelection}
              onBlur={rememberSelection}
            />
            <p id="faq-answer-hint" className="text-caption text-muted-foreground">
              Each line is its own paragraph. A live figure fills in from Property settings, so the
              answer stays right when a rate changes.
            </p>
            <FieldError message={result.fieldErrors?.answer} />
            {typed.length > 0 ? (
              <Notice>
                {typed.join(', ')} {typed.length === 1 ? 'is' : 'are'} typed in, so{' '}
                {typed.length === 1 ? 'it' : 'they'} will not change when Property settings do. If
                it is one of the live figures, insert it instead.
              </Notice>
            ) : null}
          </div>

          <Card surface="inset" aria-live="polite">
            <p className="micro-label text-muted-foreground">As the website shows it</p>
            {question.trim() === '' && preview.length === 0 ? (
              <p className="mt-xs text-body-sm text-muted-foreground">
                Write a question and its answer to see them here.
              </p>
            ) : (
              <>
                <p className="mt-xs text-body-md-strong text-foreground">{question}</p>
                {preview.map((paragraph, index) => (
                  <p key={index} className="mt-xs text-body-md text-copy">
                    {paragraph}
                  </p>
                ))}
              </>
            )}
          </Card>

          <div className="grid gap-xxs">
            <label
              htmlFor="faq-featured"
              className="flex items-center gap-sm text-body-sm text-foreground"
            >
              <Checkbox
                id="faq-featured"
                checked={featured}
                disabled={isPending || !canFeature}
                onCheckedChange={(checked) => setFeatured(checked === true)}
              />
              Show on the front page as well
            </label>
            <p className="pl-xl text-caption text-muted-foreground">
              {canFeature
                ? `The front page shows up to ${MAX_FEATURED_FAQS}; ${featuredCount} ${featuredCount === 1 ? 'is' : 'are'} there now.`
                : `The front page already shows ${MAX_FEATURED_FAQS}. Take one off it first.`}
            </p>
          </div>

          {result.status === 'error' && result.message ? (
            <FieldError message={result.message} />
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="tertiary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={isPending || !isDirty}>
            {isPending ? 'Saving…' : faq ? 'Save changes' : 'Add FAQ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
