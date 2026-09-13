'use client'

import { useActionState, useEffect } from 'react'

import { signOutOtherDevicesAction, type SignOutOtherDevicesState } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { toast } from '@/components/ui/toast-store'

/**
 * Ending every session but this one. No confirmation step: nothing is lost by
 * it but other sign-ins, and this device is the one kept.
 *
 * `secondary`, not the filled primary: it is an errand somebody runs rarely,
 * and the card above already carries a filled button.
 */

const initialState: SignOutOtherDevicesState = { status: 'idle' }

export function SignOutOtherDevices() {
  const [state, formAction, isPending] = useActionState(signOutOtherDevicesAction, initialState)

  useEffect(() => {
    if (state.status === 'done') {
      toast({
        tone: 'positive',
        title: 'Signed out everywhere else',
        description: 'This is the only device still signed in to your account.',
      })
    }
  }, [state])

  return (
    <form action={formAction} className="grid gap-lg">
      <p className="text-body-sm text-muted-foreground">
        Still signed in on the front desk computer, or on a phone you no longer have? This signs you
        out of every device except this one.
      </p>

      {state.status === 'error' && state.message ? (
        <Callout role="alert">{state.message}</Callout>
      ) : null}

      <Button type="submit" variant="secondary" disabled={isPending} className="justify-self-start">
        {isPending ? 'Signing out…' : 'Sign out other devices'}
      </Button>
    </form>
  )
}
