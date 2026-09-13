'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'

/**
 * "Updated 14:02 · Refresh", above a field screen's list.
 *
 * A phone screen left open goes stale without saying so, and the person
 * holding it has no other way to tell whether the list in front of them is
 * this morning's. The time is the list's own — read on the server — and
 * Refresh re-reads it in place rather than reloading the page.
 */
export function RefreshLine({ loadedAt }: { loadedAt: string }) {
  const [isRefreshing, startRefresh] = useTransition()
  const router = useRouter()

  return (
    <div className="flex items-center justify-between gap-md">
      <p className="text-caption text-muted-foreground">Updated {loadedAt}</p>
      <Button
        type="button"
        variant="ghost"
        size="touch"
        disabled={isRefreshing}
        onClick={() => startRefresh(() => router.refresh())}
      >
        <RefreshCw aria-hidden />
        {isRefreshing ? 'Refreshing…' : 'Refresh'}
      </Button>
    </div>
  )
}
