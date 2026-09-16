'use client'

import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'

/**
 * The field header's Sign out, which says it is working.
 *
 * On a phone on poor signal the round trip and the redirect can take a few
 * seconds, and a ghost button that does not change reads as a tap that missed
 * — so it gets tapped again. Ghost and `touch`, as before (design.md §Field).
 */
export function SignOutButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" variant="ghost" size="touch" disabled={pending} aria-busy={pending}>
      {pending ? 'Signing out…' : 'Sign out'}
    </Button>
  )
}
