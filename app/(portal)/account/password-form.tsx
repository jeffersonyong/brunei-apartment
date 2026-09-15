'use client'

import { useActionState, useEffect } from 'react'

import { changeOwnPasswordAction, type ChangePasswordState } from '@/app/(auth)/actions'
import { NewPasswordFields } from '@/components/portal/new-password-fields'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { toast } from '@/components/ui/toast-store'

/**
 * Choosing your own password in place of the temporary one an administrator
 * handed over (architecture.md §3). It used to be a dialog off the account
 * menu; it is a section of Settings now, beside the name.
 *
 * The administrator's reset in Roles & staff is untouched — they can still set
 * a new temporary password whenever somebody is locked out.
 *
 * The fields are shared with the page an emailed reset link opens
 * (`NewPasswordFields`), which is where the reasoning for keeping them
 * controlled lives. The hidden username field is for password managers, which
 * otherwise file the new password under whatever they guess the account is.
 */

const initialState: ChangePasswordState = { status: 'idle' }

export function PasswordForm({ email }: { email: string }) {
  const [state, formAction, isPending] = useActionState(changeOwnPasswordAction, initialState)

  // Keyed on the state object, not its status: a second change in the same
  // visit produces a new 'updated' object and must toast again.
  useEffect(() => {
    if (state.status === 'updated') {
      toast({
        tone: 'positive',
        title: 'Password changed',
        description: 'Use it next time you sign in. Your other devices have been signed out.',
      })
    }
  }, [state])

  return (
    <form action={formAction} className="grid gap-lg">
      <p className="text-body-sm text-muted-foreground">
        If an administrator set your password for you, replace it with one only you know. You stay
        signed in here; every other device is signed out.
      </p>

      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />

      <NewPasswordFields state={state} />

      {state.status === 'error' && state.message ? (
        <Callout role="alert">{state.message}</Callout>
      ) : null}

      <Button type="submit" disabled={isPending} className="justify-self-start">
        {isPending ? 'Saving…' : 'Change password'}
      </Button>
    </form>
  )
}
