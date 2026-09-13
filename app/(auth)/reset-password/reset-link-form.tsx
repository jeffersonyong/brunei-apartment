'use client'

import Link from 'next/link'
import { useActionState, useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { tokenFromFragment } from '@/lib/domain/password-reset'

import { AuthScreen, TEXT_ACTION_CLASSES } from '../auth-screen'
import { verifyResetLinkAction, type VerifyResetLinkState } from './actions'

/**
 * The button that spends a reset link.
 *
 * **The token is read from the fragment, on the device.** A fragment never
 * reaches a server, so the link cannot land in a request log, a proxy's or
 * Vercel's; it reaches the server once, in the body of this form's POST.
 * `useSyncExternalStore` reads it: the server has no fragment to render from,
 * so its snapshot is "not read yet", and the device's is the token or null.
 */

const initialState: VerifyResetLinkState = { status: 'idle' }

function subscribeToFragment(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange)

  return () => window.removeEventListener('hashchange', onChange)
}

function tokenOnThisDevice(): string | null {
  return tokenFromFragment(window.location.hash)
}

/** The server cannot see a fragment, so it has not read one yet. */
function tokenNotReadYet(): undefined {
  return undefined
}

const ASK_FOR_A_NEW_LINK = (
  <Link href="/forgot-password" className={TEXT_ACTION_CLASSES}>
    Ask for a new link
  </Link>
)

export function ResetLinkForm() {
  const token = useSyncExternalStore(subscribeToFragment, tokenOnThisDevice, tokenNotReadYet)
  const [state, formAction, isPending] = useActionState(verifyResetLinkAction, initialState)

  if (token === null) {
    return (
      <AuthScreen
        title="This link is incomplete"
        description="Open the link from the email again — all of it — or ask for a new one."
        footer={ASK_FOR_A_NEW_LINK}
      />
    )
  }

  return (
    <AuthScreen
      title="Set a new password"
      description="Continue to choose a new password for your staff account. The link works once."
      footer={ASK_FOR_A_NEW_LINK}
    >
      <form action={formAction} className="grid gap-lg">
        <input type="hidden" name="token" value={token ?? ''} />

        {state.status === 'error' && state.message ? (
          <Callout role="alert">{state.message}</Callout>
        ) : null}

        <Button type="submit" className="w-full" disabled={token === undefined || isPending}>
          {isPending ? 'Checking the link…' : 'Continue'}
        </Button>
      </form>
    </AuthScreen>
  )
}
