'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'

import { HoneypotField } from '@/app/(public)/_components/booking/booking-fields'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RESET_LINK_LIFETIME_WORDS } from '@/lib/domain/password-reset'

import { AuthScreen, TEXT_ACTION_CLASSES } from '../auth-screen'
import { requestPasswordResetAction, type ForgotPasswordState } from './actions'

/**
 * The three things this screen can say: that the feature is not switched on
 * yet, the form, and what happens next.
 *
 * "What happens next" is one sentence for every address — see the action — so
 * it is written as a conditional ("if this belongs to a staff account") rather
 * than a promise. The email field is controlled so a refusal leaves the address
 * where it was typed.
 */

const initialState: ForgotPasswordState = { status: 'idle' }

const BACK_TO_SIGN_IN = (
  <Link href="/login" className={TEXT_ACTION_CLASSES}>
    Back to sign in
  </Link>
)

export function ForgotPasswordForm({ isAvailable }: { isAvailable: boolean }) {
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, initialState)
  const [email, setEmail] = useState('')

  if (!isAvailable || state.status === 'unavailable') {
    return (
      <AuthScreen
        title="Reset your password"
        description="Password reset by email isn't available. Ask an administrator — they can set you a new one straight away."
        footer={BACK_TO_SIGN_IN}
      />
    )
  }

  if (state.status === 'sent') {
    return (
      <AuthScreen
        title="Check your email"
        description={`If ${state.email ?? 'that address'} belongs to a staff account, a link to choose a new password is on its way.`}
        footer={BACK_TO_SIGN_IN}
      >
        <p className="text-body-sm text-foreground">
          It works once, for {RESET_LINK_LIFETIME_WORDS}, and only the newest link works — asking
          again cancels this one.
        </p>
        <p className="mt-sm text-body-sm text-muted-foreground">
          Nothing after a few minutes? Check your spam folder, or ask an administrator to reset your
          password.
        </p>
      </AuthScreen>
    )
  }

  return (
    <AuthScreen
      title="Reset your password"
      description="Enter the email you sign in with, and we'll send you a link to choose a new password."
      footer={BACK_TO_SIGN_IN}
    >
      <form action={formAction} className="grid gap-lg">
        <HoneypotField />

        <div className="grid gap-sm">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={state.fieldErrors?.email ? true : undefined}
          />
          <FieldError message={state.fieldErrors?.email} />
        </div>

        {state.status === 'error' && state.message ? (
          <Callout role="alert">{state.message}</Callout>
        ) : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </AuthScreen>
  )
}
