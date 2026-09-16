import { cache } from 'react'
import { headers } from 'next/headers'

import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * The signed-in staff member, as the UI needs them.
 *
 * Display name lives in `auth.users.user_metadata.display_name`, written when
 * an Admin creates the account — there is no staff profile table, because
 * nothing beyond a name is stored about staff (architecture.md §3, recorded
 * there as an assumption).
 */
export interface AuthenticatedUser {
  id: string
  email: string
  displayName: string
}

/** The parts of a user, or of an access token's claims, that this module reads. */
interface Identity {
  id: string
  email: string | undefined
  metadata: Record<string, unknown> | undefined
}

function toAuthenticatedUser({ id, email, metadata }: Identity): AuthenticatedUser {
  const address = email ?? ''
  const metadataName = metadata?.display_name

  return {
    id,
    email: address,
    displayName:
      typeof metadataName === 'string' && metadataName.trim() !== '' ? metadataName : address,
  }
}

/**
 * Whether this request may be running a server action.
 *
 * A server action is found by its id, not by the URL it is posted to, so a
 * portal action can be posted to `/`, where proxy.ts checks no session. Next
 * recognises an action by the `Next-Action` header, or, for a form posted
 * without JavaScript, by a form-encoded body
 * (next/dist/server/lib/server-action-request-meta.js). Either one here means
 * the request is treated as an action. A render has neither, and a request
 * that only looks like one takes the stricter path, which costs one call.
 */
async function mayBeServerAction(): Promise<boolean> {
  const requestHeaders = await headers()
  const contentType = requestHeaders.get('content-type') ?? ''

  return (
    requestHeaders.has('next-action') ||
    contentType.startsWith('multipart/form-data') ||
    contentType.startsWith('application/x-www-form-urlencoded')
  )
}

/**
 * The signed-in user. Render reads it from the session's access token, and a
 * server action asks the auth server.
 *
 * ── Render: the token ─────────────────────────────────────────────────────
 *
 * A page or route handler on a gated path (or `/c/`) has already been checked
 * with the auth server by proxy.ts, whose `getUser()` is the gate: it refuses
 * a session signed out elsewhere or an account that was disabled. A render is
 * bound to its URL, so it cannot be moved somewhere the proxy does not check.
 * This used to ask the auth server the same question a second time for the
 * same request, on every navigation, prefetch and notifications poll.
 *
 * `getClaims()` verifies the token's signature and expiry instead. With
 * asymmetric signing keys that happens here, against a cached key set, with no
 * round trip. With a symmetric key it falls back to the same `getUser()` call
 * as before, so it is never slower than it was. The token must be a signed-in
 * user's (`aud` authenticated, with a subject), which the anon and service
 * keys are not.
 *
 * ── Actions: the auth server ──────────────────────────────────────────────
 *
 * An action can be posted to an ungated URL (see `mayBeServerAction`), where
 * no proxy check ran. The token alone would then let a session revoked
 * elsewhere, or a disabled account, keep writing until the token expired, up
 * to an hour. So an action asks the auth server here, as everything did
 * before, and a revoked session is refused at once wherever it posts.
 *
 * The claims are the token's, so the display name is the one the token was
 * issued with. Renaming yourself refreshes the session so the new name shows
 * at once (app/(portal)/account/actions.ts).
 *
 * **Not for an ungated render.** The proxy checks nothing there, so the
 * recovery screens use `getVerifiedUser` directly.
 *
 * `cache()` memoises per request: a layout, a page and several permission
 * checks in one render share a single read.
 *
 * Null means no valid session. Inside the gated surfaces that is a race
 * (signed out in another tab), and callers treat it as signed out rather than
 * an error.
 */
export const getAuthenticatedUser = cache(async (): Promise<AuthenticatedUser | null> => {
  if (await mayBeServerAction()) {
    return getVerifiedUser()
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.getClaims()

  if (
    error ||
    !data ||
    typeof data.claims.sub !== 'string' ||
    data.claims.aud !== 'authenticated'
  ) {
    return null
  }

  const { claims } = data

  return toAuthenticatedUser({
    id: claims.sub,
    email: typeof claims.email === 'string' ? claims.email : undefined,
    metadata: claims.user_metadata,
  })
})

/**
 * The signed-in user, checked with the auth server — for the paths the proxy
 * does not check.
 *
 * The password recovery screens are ungated (a reset link signs its owner in
 * on a page anyone may open), so nothing upstream has asked whether the
 * session is still live. Setting a password and ending other sessions are
 * also the two actions where a revoked session must be refused at once, so
 * both ask here, whichever screen they are called from.
 */
export const getVerifiedUser = cache(async (): Promise<AuthenticatedUser | null> => {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return null
  }

  return toAuthenticatedUser({
    id: data.user.id,
    email: data.user.email,
    metadata: data.user.user_metadata,
  })
})
