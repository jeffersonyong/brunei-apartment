'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast-store'
import { MAX_FOOD_NOTICE_LENGTH } from '@/lib/domain/food-notice'

import { saveFoodNoticeAction, type FoodNoticeActionState } from './actions'

/**
 * The words and the number guests are given about food.
 *
 * Saved through a transition rather than `<form action>`: React 19 resets a
 * form once its action settles, and a reset would put the text back to what
 * the page loaded with (the settings screen's lesson, PR #66). The version the
 * save returns is kept, so a second save in the same visit is not refused as
 * somebody else's.
 */
export function FoodNoticeEditor({
  notice,
}: {
  notice: { body: string; phone: string; updatedAt: string | null }
}) {
  const [body, setBody] = useState(notice.body)
  const [phone, setPhone] = useState(notice.phone)
  const [updatedAt, setUpdatedAt] = useState(notice.updatedAt)
  const [result, setResult] = useState<FoodNoticeActionState>({ status: 'idle' })
  const [isPending, startTransition] = useTransition()

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    startTransition(async () => {
      const data = new FormData()

      data.set('body', body)
      data.set('phone', phone)
      data.set('expectedUpdatedAt', updatedAt ?? '')

      const outcome = await saveFoodNoticeAction({ status: 'idle' }, data)

      setResult(outcome)

      if (outcome.status !== 'done') {
        return
      }

      setUpdatedAt(outcome.updatedAt ?? null)
      toast({
        tone: 'positive',
        title: !outcome.changed
          ? 'Nothing had changed'
          : body.trim() === ''
            ? 'Food notice taken off the website'
            : 'Food notice saved',
      })
    })
  }

  return (
    <form onSubmit={save} className="grid gap-lg">
      <div className="grid content-start gap-sm">
        <Label htmlFor="food-notice-body">What guests are told</Label>
        <Textarea
          id="food-notice-body"
          value={body}
          rows={6}
          maxLength={MAX_FOOD_NOTICE_LENGTH}
          disabled={isPending}
          aria-invalid={result.fieldErrors?.body ? true : undefined}
          aria-describedby="food-notice-body-hint"
          onChange={(event) => setBody(event.target.value)}
        />
        <p id="food-notice-body-hint" className="text-caption text-muted-foreground">
          Each line is its own paragraph. Leave it empty to take the food notice off the booking
          page, the confirmation email and the food page.
        </p>
        <FieldError message={result.fieldErrors?.body} />
      </div>

      <div className="grid content-start gap-sm sm:max-w-[320px]">
        <Label htmlFor="food-notice-phone">Food provider’s number</Label>
        <Input
          id="food-notice-phone"
          value={phone}
          inputMode="tel"
          placeholder="+673 333 5410"
          disabled={isPending}
          aria-invalid={result.fieldErrors?.phone ? true : undefined}
          aria-describedby="food-notice-phone-hint"
          onChange={(event) => setPhone(event.target.value)}
        />
        <p id="food-notice-phone-hint" className="text-caption text-muted-foreground">
          Shown under the text as a number guests can tap to call. Optional.
        </p>
        <FieldError message={result.fieldErrors?.phone} />
      </div>

      {result.status === 'error' && result.message ? <FieldError message={result.message} /> : null}

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
