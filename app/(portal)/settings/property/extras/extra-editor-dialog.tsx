'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { MAX_EXTRA_NAME_LENGTH, type PropertyExtra } from '@/lib/domain/extras'
import { formatCents } from '@/lib/domain/money'

import { addExtraAction, updateExtraAction, type ExtraActionState } from './actions'

/**
 * Adding or editing one extra (capability F13).
 *
 * One dialog for both, because the fields are identical and the only
 * difference is whether a row is carried in — the FAQ editor's arrangement,
 * for the same reason.
 *
 * **The price and the count are typed, not stepped.** A fee is BND as anybody
 * would write it (`28`, `28.50`) and parsed by `checkExtraDraft`; a blank
 * count means "nobody has counted these", which is the state open-questions.md
 * N8 has left the sofa bed in since the beginning and is not the same as zero.
 * The hint under the field says so, because a placeholder that said the wrong
 * one of those would be worse than an empty box.
 */
export function ExtraEditorDialog({
  extra,
  onClose,
}: {
  /** The row being edited, or nothing for a new one. */
  extra?: PropertyExtra
  onClose: () => void
}) {
  const [name, setName] = useState(extra?.name ?? '')
  const [description, setDescription] = useState(extra?.description ?? '')
  const [fee, setFee] = useState(extra ? formatCents(extra.fee) : '')
  const [stock, setStock] = useState(extra?.stock === null ? '' : String(extra?.stock ?? ''))
  const [bookable, setBookable] = useState(extra?.bookable ?? true)
  const [result, setResult] = useState<ExtraActionState>({ status: 'idle' })
  const [isPending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      const data = new FormData()

      data.set('name', name)
      data.set('description', description)
      data.set('fee', fee)
      data.set('stock', stock)
      data.set('bookable', bookable ? 'true' : 'false')

      if (extra) {
        data.set('extraId', extra.id)
        data.set('expectedUpdatedAt', extra.updatedAt)
      }

      const outcome = extra
        ? await updateExtraAction({ status: 'idle' }, data)
        : await addExtraAction({ status: 'idle' }, data)

      if (outcome.status !== 'done') {
        setResult(outcome)
        return
      }

      toast({ tone: 'positive', title: extra ? 'Extra saved' : 'Extra added' })
      onClose()
    })
  }

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[520px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{extra ? 'Edit extra' : 'New extra'}</DialogTitle>
          <DialogDescription>
            {extra
              ? 'The new price applies to bookings made from now on. Bookings already taken keep what they were charged.'
              : 'It appears on the booking forms as soon as it is saved, if you leave it on sale.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-lg">
          <div className="grid content-start gap-sm">
            <Label htmlFor="extra-name">Name</Label>
            <Input
              id="extra-name"
              value={name}
              maxLength={MAX_EXTRA_NAME_LENGTH}
              placeholder="Extra towel"
              onChange={(event) => setName(event.target.value)}
              aria-invalid={result.fieldErrors?.name ? true : undefined}
            />
            <FieldError message={result.fieldErrors?.name} />
          </div>

          <div className="grid content-start gap-sm">
            <Label htmlFor="extra-description">Description</Label>
            <Input
              id="extra-description"
              value={description}
              placeholder="A fresh bath towel, brought to the unit."
              onChange={(event) => setDescription(event.target.value)}
              aria-invalid={result.fieldErrors?.description ? true : undefined}
            />
            <p className="text-caption text-muted-foreground">
              Shown under the counter on the booking form. Optional.
            </p>
            <FieldError message={result.fieldErrors?.description} />
          </div>

          {/* Across, not down: the price and how many there are are the two
              halves of the same question — what it costs and what we have. */}
          <div className="grid gap-lg sm:grid-cols-2">
            <div className="grid content-start gap-sm">
              <Label htmlFor="extra-fee">Price per stay</Label>
              <Input
                id="extra-fee"
                inputMode="decimal"
                value={fee}
                placeholder="5.00"
                className="w-[130px] tabular-nums"
                onChange={(event) => setFee(event.target.value)}
                aria-invalid={result.fieldErrors?.fee ? true : undefined}
              />
              <p className="text-caption text-muted-foreground">
                BND, charged once for the whole stay however many nights it is.
              </p>
              <FieldError message={result.fieldErrors?.fee} />
            </div>

            <div className="grid content-start gap-sm">
              <Label htmlFor="extra-stock">How many you have</Label>
              <Input
                id="extra-stock"
                inputMode="numeric"
                value={stock}
                // Not `0`: blank means "not counted", where zero would refuse
                // every booking. A placeholder saying the wrong one of those
                // is worse than an empty box.
                placeholder="Not counted"
                className="w-[130px] tabular-nums"
                onChange={(event) => setStock(event.target.value)}
                aria-invalid={result.fieldErrors?.stock ? true : undefined}
              />
              <p className="text-caption text-muted-foreground">
                Leave blank if nobody has counted them — bookings will not be limited. With a number
                here, two bookings cannot take the same one on the same night.
              </p>
              <FieldError message={result.fieldErrors?.stock} />
            </div>
          </div>

          <label htmlFor="extra-bookable" className="flex items-start gap-sm">
            <Checkbox
              id="extra-bookable"
              checked={bookable}
              onCheckedChange={(checked) => setBookable(checked === true)}
            />
            <span className="grid gap-xxs">
              <span className="text-body-sm text-foreground">Available on booking form</span>
              <span className="text-caption text-muted-foreground">
                Customers and staff can add it when they book. Turn it off to take it off the forms
                without removing it — bookings that already have one keep it.
              </span>
            </span>
          </label>
        </div>

        {result.status === 'error' && result.message ? (
          <FieldError message={result.message} />
        ) : null}

        <DialogFooter>
          <Button type="button" variant="tertiary" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={isPending}>
            {isPending ? 'Saving…' : extra ? 'Save extra' : 'Add extra'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
