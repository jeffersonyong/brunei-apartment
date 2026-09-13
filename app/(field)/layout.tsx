import Link from 'next/link'

import { signOutAction } from '@/app/(auth)/actions'
import { OperationsSurface } from '@/components/operations-surface'
import { Button } from '@/components/ui/button'
import { landingPathFor } from '@/lib/auth/field-jobs'
import { getActor } from '@/lib/auth/require-permission'

/**
 * Field chrome: single column, mobile-first, nothing that competes with the
 * row-level primary action (design.md §Layout).
 *
 * An operations surface like the portal — same product, different hardware,
 * never seen by a customer — so it takes the monochrome register too.
 *
 * A guard's whole job is here, so they get no way to the portal they would
 * only find nothing to do in. Somebody whose day is the portal — the desk,
 * which can also check guests in — gets one link back to it.
 */
export default async function FieldLayout({ children }: { children: React.ReactNode }) {
  const actor = await getActor()
  const worksInThePortal =
    actor !== null && actor.permissions.size > 0 && landingPathFor(actor.permissions) === '/portal'

  return (
    <div className="min-h-dvh">
      <OperationsSurface />
      {/* The primary fill belongs to the row-level Check in buttons on this
          surface, so the chrome stays neutral rather than competing. */}
      <header className="border-b border-divider bg-card">
        <div className="mx-auto flex w-full max-w-[640px] items-center justify-between py-xs pr-xs pl-lg">
          <p className="text-body-sm-strong text-foreground">Palm Villa · Field</p>
          {/* Ghost, not primary — and `touch` size, like everything interactive
              on this surface (design.md §Field). */}
          <div className="flex items-center">
            {worksInThePortal ? (
              <Button asChild variant="ghost" size="touch">
                <Link href="/portal">Portal</Link>
              </Button>
            ) : null}
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="touch">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[640px] px-lg pt-lg pb-3xl">{children}</main>
    </div>
  )
}
