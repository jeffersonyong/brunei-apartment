import type { Metadata } from 'next'

import { canSendPasswordResets } from '@/lib/db/password-reset'

import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Sign in — Palm Villa Operations',
}

/**
 * The staff sign-in screen. Anyone with a session never sees it — proxy.ts
 * bounces them straight to their destination — so it renders for exactly one
 * audience: staff without a session, on any device from the front desk
 * desktop to a guard's phone.
 *
 * Whether "Forgot password?" works is this deployment's to answer (capability
 * F8, open question N42): it is always shown, and inert until email can be
 * sent.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const { next } = await searchParams

  return (
    <LoginForm
      next={typeof next === 'string' ? next : undefined}
      canResetByEmail={canSendPasswordResets()}
    />
  )
}
