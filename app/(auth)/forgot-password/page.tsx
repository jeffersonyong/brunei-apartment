import type { Metadata } from 'next'

import { canSendPasswordResets } from '@/lib/db/password-reset'

import { ForgotPasswordForm } from './forgot-password-form'

export const metadata: Metadata = {
  title: 'Reset your password — Palm Villa Operations',
}

/**
 * Rendered per request, because whether this deployment can send email is read
 * from its environment at runtime — a page prerendered at build time would
 * answer with whatever the build machine had.
 */
export const dynamic = 'force-dynamic'

/** Asking for a reset link (capability F8). The sign-in screen links here. */
export default function ForgotPasswordPage() {
  return <ForgotPasswordForm isAvailable={canSendPasswordResets()} />
}
