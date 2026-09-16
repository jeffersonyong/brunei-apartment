import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getVerifiedUser } from '@/lib/auth/session'

import { NewPasswordForm } from './new-password-form'

export const metadata: Metadata = {
  title: 'Choose a new password — Palm Villa Operations',
}

/**
 * The last step of a reset (capability F8).
 *
 * Reached through a verified link, which signs the account's owner in; without
 * a session there is no account to set a password on, so the way back is to ask
 * for a link. The form is the Settings password change — the same action, the
 * same fields — on the sign-in screen's frame, because somebody resetting a
 * forgotten password has not reached the portal yet.
 */
export default async function ChooseNewPasswordPage() {
  const user = await getVerifiedUser()

  if (!user) {
    redirect('/forgot-password')
  }

  return <NewPasswordForm email={user.email} />
}
