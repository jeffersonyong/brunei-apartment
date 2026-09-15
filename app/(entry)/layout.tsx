import Link from 'next/link'

import { OperationsSurface } from '@/components/operations-surface'
import { Button } from '@/components/ui/button'
import { mayWork } from '@/lib/auth/field-jobs'
import { getActor } from '@/lib/auth/require-permission'

/**
 * Chrome for the entry code's page (architecture.md §7).
 *
 * The field layout's shape — one column at a phone's width, a quiet header —
 * because the reader who matters is a guard with a phone at the barrier. It is
 * not the field layout itself: this page is open to anybody holding a code, so
 * there is no sign-out to offer a stranger and no job switcher. A guard gets
 * one way back to the full list.
 */
export default async function EntryLayout({ children }: { children: React.ReactNode }) {
  const actor = await getActor()
  const worksTheGate = actor !== null && mayWork(actor.permissions, 'arrivals')

  return (
    <div className="min-h-dvh">
      <OperationsSurface />
      <header className="border-b border-divider bg-card">
        <div className="mx-auto flex min-h-[64px] w-full max-w-[640px] items-center justify-between py-xs pr-xs pl-lg">
          <p className="text-body-sm-strong text-foreground">
            Palm Villa{worksTheGate ? ' · Field' : ''}
          </p>
          {worksTheGate ? (
            <Button asChild variant="ghost" size="touch">
              <Link href="/field/arrivals">Gate list</Link>
            </Button>
          ) : null}
        </div>
      </header>
      <main className="mx-auto w-full max-w-[640px] px-lg pt-lg pb-3xl">{children}</main>
    </div>
  )
}
