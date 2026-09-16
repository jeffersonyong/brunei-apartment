'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { MIN_PASSWORD_LENGTH, PASSWORD_TOO_SHORT } from '@/lib/auth/password-policy'
import { getVerifiedUser } from '@/lib/auth/session'
import { recordOwnPasswordChange } from '@/lib/db/staff'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Session actions shared by the portal and field surfaces: leaving, changing
 * your own password, and ending your other sessions. None needs a permission,
 * only a session — every staff member holds their own.
 */

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient()

  await supabase.auth.signOut()
  redirect('/login')
}

const changePasswordSchema = z
  .object({
    password: z.string().min(MIN_PASSWORD_LENGTH, PASSWORD_TOO_SHORT),
    confirm: z.string(),
  })
  .refine((value) => value.password === value.confirm, {
    path: ['confirm'],
    message: 'The passwords do not match.',
  })

export interface ChangePasswordState {
  status: 'idle' | 'error' | 'updated'
  message?: string
  fieldErrors?: Record<string, string>
}

/**
 * Provisioning hands staff a temporary password out-of-band
 * (architecture.md §3), so changing it yourself is part of the auth flow, not
 * a nicety. Re-entering the current password first is deliberately skipped in
 * v1: the session proves possession, and a forgotten current password is
 * exactly the situation this flow exists to end.
 *
 * Made on the person's own session, which GoTrue keeps while ending every
 * other one, so a password somebody else knew stops opening anything. It is
 * recorded as `staff.password_changed`, so the trail shows an administrator's
 * reset and its owner's change as two events. An administrator can still
 * reset it at any time from Roles & staff.
 */
export async function changeOwnPasswordAction(
  _previous: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const user = await getVerifiedUser()

  if (!user) {
    redirect('/login')
  }

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}

    for (const issue of parsed.error.issues) {
      const field = issue.path[0]

      if (typeof field === 'string' && !fieldErrors[field]) {
        fieldErrors[field] = issue.message
      }
    }

    return { status: 'error', fieldErrors }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })

  if (error) {
    // GoTrue's messages here are already user-facing ("New password should be
    // different from the old password.") and carry nothing sensitive.
    return { status: 'error', message: error.message }
  }

  await recordOwnPasswordChange(user.id)

  return { status: 'updated' }
}

export interface SignOutOtherDevicesState {
  status: 'idle' | 'error' | 'done'
  message?: string
}

/**
 * Ends every session this person holds except the one asking — the front desk
 * computer somebody forgot to leave, a phone that went missing. GoTrue revokes
 * the other sessions outright: their refresh tokens are refused, and their
 * access tokens stop verifying at once, because every request to a gated path
 * checks the session with the auth server (proxy.ts).
 *
 * Not audited. It changes nothing about the business's records or what anyone
 * may do; the password change it often comes before is recorded.
 */
export async function signOutOtherDevicesAction(): Promise<SignOutOtherDevicesState> {
  const user = await getVerifiedUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signOut({ scope: 'others' })

  if (error) {
    return {
      status: 'error',
      message: 'Your other devices could not be signed out. Try again in a moment.',
    }
  }

  return { status: 'done' }
}
