'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import { AuthScreen, TEXT_ACTION_CLASSES } from '../auth-screen'
import { signInAction, type SignInState } from './actions'

/**
 * The sign-in card: the sidebar's brand block above a hairline card, one
 * primary fill (design.md §Components — Cards, Buttons). No Fraunces — the
 * display face belongs to the public site and each portal screen's h1, and
 * this screen is chrome, not content.
 */

const initialState: SignInState = { status: 'idle' }

interface LoginFormProps {
  next?: string
  /** Whether this deployment can email a reset link (capability F8). */
  canResetByEmail: boolean
}

export function LoginForm({ next, canResetByEmail }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(signInAction, initialState)

  return (
    <AuthScreen
      title="Sign in"
      description="Staff accounts are created by an administrator."
      footer="Locked out? Ask an administrator to reset your password."
    >
      <form action={formAction} className="grid gap-lg">
        {next ? <input type="hidden" name="next" value={next} /> : null}

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
            aria-invalid={state.fieldErrors?.email ? true : undefined}
          />
          <FieldError message={state.fieldErrors?.email} />
        </div>

        <div className="grid gap-sm">
          {/* The label row is where design.md puts a text action — the one
              place a control fits without another bordered rectangle. */}
          <div className="flex items-baseline justify-between gap-lg">
            <Label htmlFor="password">Password</Label>
            <ForgotPassword isAvailable={canResetByEmail} />
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            aria-invalid={state.fieldErrors?.password ? true : undefined}
          />
          <FieldError message={state.fieldErrors?.password} />
        </div>

        {state.status === 'error' && state.message ? (
          <Callout role="alert">{state.message}</Callout>
        ) : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthScreen>
  )
}

/**
 * "Forgot password?" — a link once this deployment can send email, and until
 * then the same words, visibly unavailable.
 *
 * Shown either way rather than appearing on the day it works, so staff learn
 * where it is now. Inert, it is announced as a disabled link and keeps focus so
 * the tooltip saying why is reachable from a keyboard — the construction the
 * portal's notifications control uses for a feature not switched on. On a phone
 * the tooltip never opens, which is why the line under the card says who to ask.
 */
function ForgotPassword({ isAvailable }: { isAvailable: boolean }) {
  if (isAvailable) {
    return (
      <Link href="/forgot-password" className={`text-body-sm ${TEXT_ACTION_CLASSES}`}>
        Forgot password?
      </Link>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="link"
            aria-disabled="true"
            tabIndex={0}
            className="cursor-default rounded-sm text-body-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Forgot password?
          </span>
        </TooltipTrigger>
        <TooltipContent>Not switched on yet — ask an administrator to reset it</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
