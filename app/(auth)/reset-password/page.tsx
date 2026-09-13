import type { Metadata } from 'next'

import { ResetLinkForm } from './reset-link-form'

export const metadata: Metadata = {
  title: 'Set a new password — Palm Villa Operations',
}

/**
 * Where an emailed reset link lands (capability F8). The token rides in the
 * link's fragment, which the browser never sends here, so this page renders the
 * same for everyone and the form reads the token on the device.
 */
export default function ResetPasswordPage() {
  return <ResetLinkForm />
}
