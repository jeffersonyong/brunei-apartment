'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import type { FieldJob } from '@/lib/auth/field-jobs'
import { cn } from '@/lib/utils'

/**
 * The field screens a person can switch between, for somebody who holds more
 * than one job (lib/auth/field-jobs.ts) — an administrator, or a role built to
 * both guard the gate and turn the rooms.
 *
 * Rendered only when there are two or more: with one job a guard or a cleaner
 * lands straight on their screen, and a tab bar of one is chrome. And only on
 * one of those screens — never on the chooser at `/field`, whose cards already
 * ask the same question, so a bar with nothing selected above them was the
 * choice offered twice (Jeff, 13 September 2026).
 *
 * The segmented construction `components/ui/tabs.tsx` uses — a muted track
 * with the current place lifted out of it as a chip carrying `shadow-lift` —
 * because "where am I" is never carried by colour in this system. Links rather
 * than Radix tabs: each is a page with its own URL, and a phone's back button
 * should move between them. Every segment is the field surface's 48px.
 */
export function FieldNav({ jobs }: { jobs: readonly Pick<FieldJob, 'id' | 'label' | 'href'>[] }) {
  const pathname = usePathname()
  const isCurrentPage = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  if (!jobs.some((job) => isCurrentPage(job.href))) {
    return null
  }

  return (
    <nav aria-label="Field screens" className="mx-auto w-full max-w-[640px] px-lg pt-md">
      <ul className="flex gap-xxs rounded-md bg-muted p-xxs">
        {jobs.map((job) => {
          const isCurrent = isCurrentPage(job.href)

          return (
            <li key={job.id} className="flex flex-1">
              <Link
                href={job.href}
                aria-current={isCurrent ? 'page' : undefined}
                className={cn(
                  'flex min-h-touch flex-1 items-center justify-center rounded-sm px-md text-body-md transition-colors outline-none',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-muted',
                  isCurrent
                    ? 'bg-tab-chip font-medium text-foreground shadow-lift'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {job.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
