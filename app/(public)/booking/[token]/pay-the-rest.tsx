'use client'

import { ArrowRight } from 'lucide-react'
import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { Card } from '@/components/ui/card'
import { formatCents, type Cents } from '@/lib/domain/money'
import type { BankAccountSettings } from '@/lib/domain/settings'

import { submitBalanceTransferAction, type SubmitTransferState } from './actions'
import { BankAccounts } from './bank-accounts'

/**
 * Paying the rest of the stay before arriving (capability A12, Jason's team,
 * 8 October 2026).
 *
 * For a guest who sent only the deposit: the stay is still owed, and until
 * now the page could only say it is settled on arrival. This is the same card
 * as the first transfer's, asking for the second — the figure, where to send
 * it, the reference — and the same kind of button: pressing it is a claim,
 * not a payment, and puts a transfer in front of somebody who checks the bank.
 *
 * The figure is the whole of what is owed (lib/domain/rest-transfer.ts), so
 * there is nothing to choose. It is posted back with the press, and the
 * database refuses it if the booking has moved since the page loaded.
 *
 * **It promises no email.** A guest hears from us twice per booking and never
 * a third time (prd.md §13); the page says the transfer is being checked,
 * then that the stay is settled, and that is where they look.
 */

const initialState: SubmitTransferState = { status: 'idle' }

export function PayTheRest({
  token,
  reference,
  amount,
  accounts,
}: {
  token: string
  reference: string
  amount: Cents
  accounts: readonly BankAccountSettings[]
}) {
  const [state, formAction, isPending] = useActionState(submitBalanceTransferAction, initialState)

  return (
    <Card className="mt-xl">
      <p className="micro-label text-notice-warning-foreground">Pay the rest now</p>

      <p className="mt-md text-display-sm text-foreground tabular-nums">
        BND {formatCents(amount)}
      </p>
      <p className="mt-xs text-body-sm text-muted-foreground">
        What is left to pay for the stay. You can pay it when you arrive, or transfer it now so
        there is nothing to settle at the gate.
      </p>

      <BankAccounts accounts={accounts} />

      <p className="mt-lg text-body-sm text-copy">
        Send{' '}
        <strong className="text-body-sm-strong text-foreground tabular-nums">
          BND {formatCents(amount)}
        </strong>{' '}
        in one transfer with{' '}
        <strong className="font-mono text-body-sm-strong text-foreground">{reference}</strong> as
        the transfer reference, then confirm below. You can send us the slip for it from this page
        after that.
      </p>

      {state.status === 'error' && state.message ? (
        <Callout tone="negative" placement="nested" className="mt-lg" role="alert">
          {state.message}
        </Callout>
      ) : null}

      <form action={formAction} className="mt-lg">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="expected" value={amount} />
        <Button type="submit" variant="tertiary" className="w-full" disabled={isPending}>
          {isPending ? (
            'Telling the team…'
          ) : (
            <>
              I have transferred the rest
              <ArrowRight aria-hidden />
            </>
          )}
        </Button>
      </form>
    </Card>
  )
}
