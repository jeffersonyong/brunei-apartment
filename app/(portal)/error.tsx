'use client'

import { RouteError } from '@/components/route-error'

/** A portal screen that failed to load, inside the shell — see RouteError. */
export default function PortalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <RouteError
      error={error}
      retry={retry}
      help="If it keeps happening, tell whoever looks after the system and give them the reference below."
      home={{ href: '/dashboard', label: 'Go to the dashboard' }}
    />
  )
}
