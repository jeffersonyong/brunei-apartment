import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'

import { AUTH_SEGMENTS, ENTRY_SEGMENT, FIELD_SEGMENT, PORTAL_SEGMENTS } from '@/lib/auth/surfaces'
import { env } from '@/lib/env'

/**
 * What a search engine may index, which differs by host (17 September 2026).
 *
 * The customer site and the staff side are one application on two hosts
 * (architecture.md §3), so one written file cannot answer for both: the staff
 * host asks nobody to find it, and the site wants to be found. The host is read
 * from the request, the way the proxy reads it, which makes this route dynamic.
 *
 * It is a courtesy, not a gate — a crawler that ignores it still meets
 * `requirePermission` on every screen that matters. What it prevents is the
 * sign-in page turning up in a search for the property's name.
 */
export const dynamic = 'force-dynamic'

/** Token URLs: nobody's booking or entry code belongs in an index. */
const PRIVATE_PATHS = [`/booking/`, `/${ENTRY_SEGMENT}/`]

export default async function robots(): Promise<MetadataRoute.Robots> {
  const split = env.hostSplit
  const requested = await headers()
  const host = requested.get('x-forwarded-host') ?? requested.get('host')

  if (split !== null && host === new URL(split.staff).host) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // With the hosts split, the staff paths are not served here at all — the
      // proxy sends them to the other origin. Named anyway, because locally and
      // on a preview one host serves everything, and that is exactly where a
      // stray deployment would otherwise be crawled.
      disallow: [
        ...PRIVATE_PATHS,
        ...(split === null
          ? [...PORTAL_SEGMENTS, FIELD_SEGMENT, ...AUTH_SEGMENTS].map((segment) => `/${segment}`)
          : []),
      ],
    },
  }
}
