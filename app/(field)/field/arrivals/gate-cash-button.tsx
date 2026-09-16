'use client'

import { useActionState, useEffect, useState } from 'react'
import { Banknote } from 'lucide-react'

import { CASH_MAY_NOT_HAVE_GONE_THROUGH } from '@/components/field/did-not-go-through'
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
import { Notice } from '@/components/ui/notice'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast-store'
import type { GateCashDue } from '@/lib/domain/gate'
import { centsFromInput, formatCents } from '@/lib/domain/money'
import { cn } from '@/lib/utils'

import { takeCashAtGateAction, type GateCashState } from './actions'

/**
 * Taking the cash a guest still owes, at the gate (capability D6, N54).
 *
 * The card has already decided what the money is for — the deposit first, then
 * the stay, or a day pass — so the guard is never asked to tell one kind of
 * money from another. The dialog names the figure, and he counts the notes
 * against it.
 *
 * **A fixed figure, except for the stay.** A deposit, the rest of a short one
 * and a day pass are taken whole: a guest who cannot pay them in full is the
 * office's to sort out. The stay is typed, opened on what is owed, because a
 * guest handing over what they have is a real case, and anything else asks why
 * — the desk's own amount rule, live.
 *
 * **The dialog posts what it showed.** The server records nothing unless that
 * is still what is owed, so a second press after an answer was lost on one bar
 * of signal is refused rather than recorded twice — and a lost answer says to
 * refresh, not that nothing was recorded, because here that may be untrue.
 */

const initialState: GateCashState = { status: 'idle' }

interface GateCashButtonProps {
  bookingId: string
  reference: string
  guestName: string
  /** The unit, or "Day pass · 3 people". */
  place: string
  due: GateCashDue
  /** The card's only action gets the primary fill; above a move, the tertiary. */
  isPrimary: boolean
  className?: string
}

export function GateCashButton({ className, isPrimary, ...props }: GateCashButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        size="touch"
        variant={isPrimary ? undefined : 'tertiary'}
        className={cn('w-full', className)}
        onClick={() => setIsOpen(true)}
      >
        <Banknote aria-hidden />
        Take BND {formatCents(props.due.amount)}
      </Button>

      {/* Mounted only while open, so it opens with no stale refusal. */}
      {isOpen ? <GateCashDialog {...props} onClose={() => setIsOpen(false)} /> : null}
    </>
  )
}

function titleOf(due: GateCashDue, guestName: string): string {
  switch (due.kind) {
    case 'deposit':
      return `Take the BND ${formatCents(due.amount)} security deposit?`
    case 'deposit_shortfall':
      return `Take the BND ${formatCents(due.amount)} still owed on the deposit?`
    case 'stay':
      return `Take payment for ${guestName}'s stay?`
    case 'pass':
      return `Take BND ${formatCents(due.amount)} for the day pass?`
  }
}

function GateCashDialog({
  bookingId,
  reference,
  guestName,
  place,
  due,
  onClose,
}: Omit<GateCashButtonProps, 'className' | 'isPrimary'> & { onClose: () => void }) {
  // Opened on what is owed, which is what is handed over almost every time.
  const [amount, setAmount] = useState(formatCents(due.amount))

  const [state, formAction, isPending] = useActionState(
    async (previous: GateCashState, formData: FormData): Promise<GateCashState> => {
      let result: GateCashState

      try {
        result = await takeCashAtGateAction(previous, formData)
      } catch {
        return { status: 'error', message: CASH_MAY_NOT_HAVE_GONE_THROUGH }
      }

      // Said here, the moment the server answers: the same response re-renders
      // the card with what is owed next, which unmounts this dialog before an
      // effect would run (gate-action-button.tsx has the same note).
      if (result.status === 'done' && result.taken) {
        toast({
          tone: 'positive',
          title: `BND ${formatCents(result.taken.amount)} taken from ${result.taken.guestName}`,
          description: result.taken.confirmed
            ? `${reference} is confirmed`
            : `${reference} · ${place}`,
        })
      }

      return result
    },
    initialState,
  )

  useEffect(() => {
    if (state.status === 'done') {
      onClose()
    }
  }, [state.status, onClose])

  const isStay = due.kind === 'stay'
  const typed = isStay ? centsFromInput(amount) : due.amount
  const needsReason = isStay && typed !== null && typed !== due.amount
  const figure = typed !== null && typed > 0 ? typed : due.amount

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{titleOf(due, guestName)}</DialogTitle>
          <DialogDescription>
            {reference} · {place}. Count the notes first. It is recorded as cash, under your name.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-lg">
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="kind" value={due.kind} />
          <input type="hidden" name="owedCents" value={due.amount} />

          {due.kind === 'deposit' && due.promised ? (
            <Notice>
              They said they sent this by bank transfer. Only take cash if that transfer did not go
              through — if it did, the office checks the bank instead.
            </Notice>
          ) : null}

          {isStay ? (
            <div className="grid gap-sm">
              <Label htmlFor="gate-cash-amount">Amount taken</Label>
              <div className="flex items-center gap-sm">
                <span className="text-body-sm text-muted-foreground">BND</span>
                <Input
                  id="gate-cash-amount"
                  name="amount"
                  inputMode="decimal"
                  inputSize="touch"
                  autoComplete="off"
                  className="w-[180px] tabular-nums"
                  value={amount}
                  aria-invalid={Boolean(state.fieldErrors?.amount)}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </div>
              {state.fieldErrors?.amount ? (
                <FieldError message={state.fieldErrors.amount} />
              ) : (
                <p className="text-caption text-muted-foreground">
                  BND {formatCents(due.amount)} is owed. Anything else needs a reason.
                </p>
              )}
            </div>
          ) : null}

          {needsReason ? (
            <div className="grid gap-sm">
              <Label htmlFor="gate-cash-reason">This is not what is owed — why?</Label>
              <Textarea
                id="gate-cash-reason"
                name="amountOverrideReason"
                required
                maxLength={280}
                placeholder="Guest is paying the rest at the office tomorrow"
                defaultValue={state.submitted?.amountOverrideReason ?? ''}
                aria-invalid={Boolean(state.fieldErrors?.amountOverrideReason)}
              />
              <FieldError message={state.fieldErrors?.amountOverrideReason} />
            </div>
          ) : null}

          {state.status === 'error' && !state.fieldErrors ? (
            <FieldError message={state.message} />
          ) : null}

          <DialogFooter>
            <Button type="button" variant="tertiary" size="touch" onClick={onClose}>
              Not yet
            </Button>
            <Button type="submit" size="touch" disabled={isPending}>
              {isPending ? 'Recording…' : `Take BND ${formatCents(figure)}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
