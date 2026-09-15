'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { changeOwnPasswordAction, type ChangePasswordState } from '@/app/(auth)/actions'
import { NewPasswordFields } from '@/components/portal/new-password-fields'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'

import { AuthScreen } from '../../auth-screen'

/**
 * Choosing the new password once a reset link has signed its owner in: the
 * Settings password change — its action, its fields — on the sign-in frame.
 *
 * **The account comes first, on a line of its own.** A reset link signs in
 * whoever opens it as the account it was made for, so a link somebody asked
 * for on their own account and forwarded under another pretext would have the
 * person opening it choose a password for — and then work in — an account that
 * is not theirs. Saying whose account this is, before anything can be typed, is
 * the defence; architecture.md §3 records the case.
 *
 * On success it says so and hands over to the portal, rather than redirecting,
 * so the change is confirmed in words before the screen becomes a different
 * one. The action records it as `staff.password_changed`, after the
 * `email.sent` that delivered the link, so the account's trail reads as what
 * happened.
 */

const initialState: ChangePasswordState = { status: 'idle' }

export function NewPasswordForm({ email }: { email: string }) {
  const [state, formAction, isPending] = useActionState(changeOwnPasswordAction, initialState)

  if (state.status === 'updated') {
    return (
      <AuthScreen
        title="Password changed"
        description="You're signed in. Use the new password next time — every other device has been signed out."
      >
        <Button asChild className="w-full">
          <Link href="/dashboard">Continue to the portal</Link>
        </Button>
      </AuthScreen>
    )
  }

  return (
    <AuthScreen title="Choose a new password" description="You stay signed in on this device.">
      <div className="grid gap-xxs">
        <p className="text-caption text-muted-foreground">Account</p>
        <p className="text-body-md-strong break-all text-foreground">{email}</p>
        <p className="text-caption text-muted-foreground">
          Not your email address? Stop here and tell an administrator.
        </p>
      </div>

      <form action={formAction} className="mt-lg grid gap-lg">
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />

        <NewPasswordFields state={state} />

        {state.status === 'error' && state.message ? (
          <Callout role="alert">{state.message}</Callout>
        ) : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save password'}
        </Button>
      </form>
    </AuthScreen>
  )
}
