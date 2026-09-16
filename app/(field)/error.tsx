'use client'

import { RouteError } from '@/components/route-error'

/** A field screen that failed to load, under the field header — see RouteError. */
export default function FieldError({
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
      help="If the signal is weak, move and try again. If it keeps happening, tell the office and give them the reference below."
      home={{ href: '/field', label: 'Back to field screens' }}
    />
  )
}
