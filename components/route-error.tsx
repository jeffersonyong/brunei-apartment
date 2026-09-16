'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import type { Route } from 'next'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * What a screen shows when it failed to load (design.md §Components — Error
 * screens).
 *
 * Every route group's `error.tsx` renders this. Without one, a failed read
 * replaced the whole window with Next's own error page: the portal lost its
 * sidebar, and a customer lost the site's header and any way back. The
 * boundary sits inside each group's layout, so the chrome stays and only the
 * content area changes.
 *
 * **What it says.** It does not repeat the error. In production Next forwards
 * no message from the server, and the one it would forward in development is
 * an engineer's sentence. What it offers instead is the two things a reader
 * can act on: try again (most failures here are a dropped connection or a
 * database that took too long, and a second attempt works), and a reference.
 * The reference is Next's digest, the key the server log holds the real error
 * under, so "it said 3829104" is a report somebody can follow up.
 *
 * The block is the empty state's (a `muted` panel, centred), because it is
 * that construction: nothing to show, and what to do about it. It is not a
 * negative callout. A callout reports a refusal the reader caused, and the
 * reader caused none of this.
 */
export function RouteError({
  error,
  retry,
  help,
  home,
  className,
}: {
  error: Error & { digest?: string }
  retry: () => void
  /** Who to tell if it keeps happening, in this surface's voice. */
  help: React.ReactNode
  /** The way out when trying again does not help. */
  home: { href: Route; label: string }
  className?: string
}) {
  // `retry` re-fetches the segment. Inside a transition the button can say so
  // while the request is out, rather than sitting unchanged for a second.
  const [isRetrying, startRetry] = useTransition()

  return (
    <div role="alert" className={cn('rounded-lg bg-muted px-lg py-2xl text-center', className)}>
      <h1 className="text-display-xs text-foreground">This page didn&rsquo;t load</h1>
      <p className="mx-auto mt-sm max-w-[52ch] text-body-sm text-muted-foreground">
        Something went wrong on our side. Trying again usually works. {help}
      </p>

      <div className="mt-lg flex flex-wrap items-center justify-center gap-sm">
        <Button
          type="button"
          disabled={isRetrying}
          aria-busy={isRetrying}
          onClick={() => startRetry(() => retry())}
        >
          {isRetrying ? 'Trying again…' : 'Try again'}
        </Button>
        <Button asChild variant="tertiary">
          <Link href={home.href}>{home.label}</Link>
        </Button>
      </div>

      {error.digest ? (
        <p className="mt-lg text-caption text-muted-foreground">
          Reference <span className="font-mono tabular-nums">{error.digest}</span>
        </p>
      ) : null}
    </div>
  )
}
