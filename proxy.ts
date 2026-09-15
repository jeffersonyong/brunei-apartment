import { NextResponse, type NextRequest } from 'next/server'

import { safeNextPath } from '@/lib/auth/next-path'
import { crossHostRedirect, isEntryPath, isGatedPath } from '@/lib/auth/surfaces'
import { env } from '@/lib/env'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * The request pipeline's two jobs (architecture.md §3).
 *
 * **Which host.** The customer site and the staff side live on two hosts, and
 * a path that arrived on the wrong one is sent to the right one before anything
 * else happens — `bruneiapartment.com/bookings` to the portal host,
 * `portal.bruneiapartment.com/stay` back to the site. lib/auth/surfaces.ts
 * decides; with no split configured, nothing moves.
 *
 * **Is anyone signed in** — on the portal and the field screens only. This
 * never answers "may they do this": authorisation is requirePermission() in
 * the server layer (architecture.md §4), called at the top of every server
 * action and again at render time for gated screens. Keeping the two apart
 * means a routing mistake here can leak a page shell, never a mutation or a
 * row.
 */
export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  // The host the browser asked for, from the headers: `nextUrl` carries the
  // server's own address wherever the platform does not rewrite it, which
  // would make every request look like it came from neither host. Reading a
  // header is safe here because it only decides *whether* to redirect — the
  // target is always a configured origin (lib/auth/surfaces.ts).
  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? request.nextUrl.host

  const elsewhere = crossHostRedirect({ host, pathname, search }, env.hostSplit)

  // Temporary, not permanent: a browser caches a 308 indefinitely, and a
  // mistyped origin would then outlive its own fix.
  if (elsewhere !== null) {
    return NextResponse.redirect(elsewhere, 307)
  }

  // The entry code's page is open to anyone and sends nobody to sign in, but a
  // guard reads the gate on it — so his session is refreshed here as on any
  // gated screen. A server component cannot write the renewed cookie, and a
  // guard whose hour-old access token had lapsed would otherwise be shown the
  // stranger's summary.
  if (isEntryPath(pathname)) {
    return (await updateSession(request)).response
  }

  // The public site and the recovery screens: no session to check, so no
  // round-trip to the auth server.
  if (pathname !== '/login' && !isGatedPath(pathname)) {
    return NextResponse.next()
  }

  const { response, user } = await updateSession(request)

  if (pathname === '/login') {
    if (!user) {
      return response
    }

    // Already signed in — the login screen has nothing to offer, so honour
    // the (validated) next target. The refreshed session cookies move onto
    // the redirect, or the browser would keep the stale ones.
    const redirect = NextResponse.redirect(
      onThisHost(safeNextPath(request.nextUrl.searchParams.get('next')), request, host),
    )

    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie)
    }

    return redirect
  }

  if (!user) {
    // Send them to sign in, remembering where they were headed. No cookie
    // copying: there is no session to preserve.
    const login = onThisHost('/login', request, host)
    login.searchParams.set('next', pathname + search)

    return NextResponse.redirect(login)
  }

  return response
}

/**
 * A path on the host this request is already on.
 *
 * On the portal host it is built from the configured staff origin, for the
 * reason `host` is read from the headers above: `request.url` may carry the
 * server's own address, and a sign-in redirect sent there would set the session
 * cookie on a host the portal never sees. Anywhere else — one host serving
 * everything — the request's own URL is the only answer there is.
 */
function onThisHost(path: string, request: NextRequest, host: string): URL {
  const split = env.hostSplit

  return split !== null && host === new URL(split.staff).host
    ? new URL(path, split.staff)
    : new URL(path, request.url)
}

export const config = {
  // Every page, because the host check has to see public paths too — they are
  // what the portal host sends back to the site. Only the scheduled jobs and
  // Next's own assets stay out: a cron caller has no cookies and no host to be
  // wrong about. The staff screens no longer share a URL prefix, so the gate
  // is decided in code (isGatedPath) rather than by this matcher.
  matcher: ['/((?!api/|_next/).*)'],
}
