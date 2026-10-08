import { Fragment } from 'react'

import { Callout } from '@/components/ui/callout'
import { accountsIntroFor } from '@/lib/domain/booking-email'
import type { BankAccountSettings } from '@/lib/domain/settings'

/**
 * Where to send it: the property's bank accounts, from Property settings.
 *
 * Shared by the two cards that ask for a transfer — the first one, and the
 * rest of the stay sent later (capability A12) — so they cannot list the
 * accounts differently. **Two accounts, and nothing routes on which one is
 * used**: a Bruneian customer banks with one or the other and transfers within
 * their own bank without a fee (prd.md §10.1). The number alone is shown, with
 * no account name, which is what the client gave and what a transfer form asks
 * for. With none configured the card says to call rather than showing nothing.
 */
export function BankAccounts({ accounts }: { accounts: readonly BankAccountSettings[] }) {
  if (accounts.length === 0) {
    return (
      <Callout tone="negative" placement="nested" className="mt-lg">
        We cannot show the bank details right now. Please call us and we will give them to you.
      </Callout>
    )
  }

  return (
    <>
      <p className="mt-lg text-body-sm-strong text-foreground">
        {accountsIntroFor(accounts.length)}
      </p>
      <dl className="mt-sm">
        {accounts.map((account, index) => (
          <Fragment key={account.id}>
            {index > 0 ? <OrRule /> : null}
            <div className="flex items-baseline justify-between gap-lg py-xs">
              {/* Mute, like the "or" and its rules: a bank name labels the
                  number beside it, and the number is the content (design.md
                  §Typography — the two-step ladder). */}
              <dt className="text-body-md text-muted-foreground">{account.bankName}</dt>
              <dd className="font-mono text-body-md text-foreground">{account.accountNumber}</dd>
            </div>
          </Fragment>
        ))}
      </dl>
    </>
  )
}

/**
 * The rule either side of "or", so the two accounts read as one choice.
 *
 * The rule takes the word's own colour rather than `divider`, which is the
 * weight the email settled on — there it draws over amber, where a hairline
 * meant for white all but disappears. Kept here so the same block reads the
 * same on both surfaces. `aria-hidden` because the sentence above the list
 * already says the accounts are alternatives — this repeats it for the eye,
 * not for a screen reader.
 */
function OrRule() {
  return (
    <div aria-hidden className="flex items-center gap-md py-xs">
      <span className="h-px flex-1 bg-muted-foreground" />
      <span className="micro-label text-muted-foreground">or</span>
      <span className="h-px flex-1 bg-muted-foreground" />
    </div>
  )
}
