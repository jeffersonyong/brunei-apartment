'use server'

import { redirect } from 'next/navigation'

import { isRecoveryTokenHash } from '@/lib/domain/password-reset'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Opening an emailed reset link (capability F8).
 *
 * The link's token is spent here, on a button press, and never on the page
 * load: mail systems open links to scan them, and a token spent by a scanner
 * is a link that fails for the person it was sent to. Verifying signs the
 * account's owner in — that is what possession of the link proves — and the
 * next page is where the new password is chosen.
 *
 * **One sentence for every refusal.** A token that was never a token, one that
 * has expired, one already used, one cancelled by a newer link, and one for an
 * account an administrator has since disabled all read the same, so the answer
 * says nothing about the account behind it.
 */

export interface VerifyResetLinkState {
  status: 'idle' | 'error'
  message?: string
}

const LINK_REFUSED =
  'This link has expired or has already been used. Ask for a new one — only the newest link works.'

export async function verifyResetLinkAction(
  _previous: VerifyResetLinkState,
  formData: FormData,
): Promise<VerifyResetLinkState> {
  const token = formData.get('token')

  // Checked before it reaches the auth server, so only the shape GoTrue issues
  // is ever sent to it.
  if (typeof token !== 'string' || !isRecoveryTokenHash(token)) {
    return { status: 'error', message: LINK_REFUSED }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: token })

  if (error) {
    return { status: 'error', message: LINK_REFUSED }
  }

  redirect('/reset-password/new')
}
