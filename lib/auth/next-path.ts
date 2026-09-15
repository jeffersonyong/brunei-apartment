import { isGatedPath } from './surfaces'

/**
 * Validation for the `?next=` redirect target on the sign-in flow.
 *
 * The parameter round-trips through the browser, so it is untrusted input: an
 * unchecked redirect target is an open-redirect vulnerability (send staff a
 * login link whose `next` points at a look-alike site and harvest the retry).
 * Only in-app operations paths are honoured; anything else falls back to the
 * portal home.
 */

export const DEFAULT_SIGNED_IN_PATH = '/dashboard'

/**
 * Honours a path only when its first segment is one of the gated screens
 * (surfaces.ts). That rejects absolute URLs (`https://…`), scheme-relative ones
 * (`//evil`), the public site (`/booking/…`, one letter from `/bookings`) and
 * look-alike segments (`/dashboard-status`), while allowing sub-paths and query
 * strings.
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || !isGatedPath(raw)) {
    return DEFAULT_SIGNED_IN_PATH
  }

  return raw
}
