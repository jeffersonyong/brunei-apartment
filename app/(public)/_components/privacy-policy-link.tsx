import Link from 'next/link'

import { isPrivacyPolicyPublished } from '@/lib/db/privacy-policy'

/**
 * Whether the website has a privacy policy to link to (capability F10).
 *
 * Asked by the public layout on every page, so **a failed read never fails
 * the page**: it logs and answers no, which leaves the links inactive rather
 * than pointing at a page that may 404. Logged rather than swallowed, for the
 * reason the landing page's reads are — a link quietly gone dead is exactly
 * what nobody would notice.
 */
export async function readPrivacyPolicyPublished(): Promise<boolean> {
  try {
    return await isPrivacyPolicyPublished()
  } catch (error) {
    console.error(
      'Could not tell whether a privacy policy is published; its links stay inactive.',
      error,
    )

    return false
  }
}

/**
 * The footer's *Privacy policy*: a link once staff have published one, and
 * inert until then (Jeff, 15 September 2026).
 *
 * Inert rather than absent, so the place it will live is visible — and a
 * disabled link rather than plain text, so a screen reader says what it is
 * and that it does nothing yet. No `href`: there is nowhere to go.
 */
export function FooterPrivacyPolicyLink({ isPublished }: { isPublished: boolean }) {
  if (isPublished) {
    return <Link href="/privacy">Privacy policy</Link>
  }

  return (
    <span role="link" aria-disabled="true" className="cursor-default opacity-50">
      Privacy policy
    </span>
  )
}
