'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getAuthenticatedUser } from '@/lib/auth/session'
import { renameStaffAccount } from '@/lib/db/staff'

/**
 * A staff member's own account, from Settings.
 *
 * Gated on a session rather than a permission: naming yourself needs nobody's
 * leave. The account written is always the session's — never an id from the
 * form — so there is nothing here for one person to point at another.
 */

export interface RenameSelfState {
  status: 'idle' | 'error' | 'done'
  fieldErrors?: Record<string, string>
}

const renameSelfSchema = z.object({
  // The bounds an administrator creating the account works to
  // (settings/roles/actions.ts).
  displayName: z
    .string()
    .trim()
    .min(1, 'Enter your name.')
    .max(120, 'Keep it under 120 characters.'),
})

export async function renameSelfAction(
  _previous: RenameSelfState,
  formData: FormData,
): Promise<RenameSelfState> {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  const parsed = renameSelfSchema.safeParse({ displayName: formData.get('displayName') ?? '' })

  if (!parsed.success) {
    return {
      status: 'error',
      fieldErrors: { displayName: parsed.error.issues[0]?.message ?? 'Enter your name.' },
    }
  }

  const { changed } = await renameStaffAccount(user.id, parsed.data.displayName, user.id)

  if (changed) {
    // The name is in the shell — the sidebar's account row — as well as on
    // this screen, so the portal's layout re-renders, not just the page. At the
    // root: the portal's screens no longer share a prefix to scope it to.
    revalidatePath('/', 'layout')
  }

  return { status: 'done' }
}
