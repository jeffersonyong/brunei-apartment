import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

import { fieldJobsFor } from '@/lib/auth/field-jobs'
import { getActor } from '@/lib/auth/require-permission'

export const metadata: Metadata = {
  title: 'Field',
}

/** Reads the session, so it cannot be prerendered. */
export const dynamic = 'force-dynamic'

/**
 * The field home: where a phone lands, and never a screen anybody stays on.
 *
 * One job — a guard — goes straight to it, because a menu of one is a tap
 * standing between a car and the barrier. Several jobs get one large card each.
 * None gets a sentence saying so, rather than an empty screen.
 */
export default async function FieldHomePage() {
  const actor = await getActor()
  const jobs = actor ? fieldJobsFor(actor.permissions) : []
  const [onlyJob] = jobs

  if (jobs.length === 1 && onlyJob) {
    redirect(onlyJob.href)
  }

  if (jobs.length === 0) {
    return (
      <>
        <h1 className="text-display-sm text-foreground">Field screens</h1>
        <p className="mt-sm text-body-md text-muted-foreground">
          There is nothing on the field screens for your account. They are for checking guests in at
          the gate — ask an administrator if that is part of your job.
        </p>
      </>
    )
  }

  return (
    <>
      <h1 className="text-display-sm text-foreground">Field screens</h1>
      <ul className="mt-lg grid gap-md">
        {jobs.map((job) => (
          <li key={job.id}>
            <Link
              href={job.href}
              className="flex min-h-touch items-center justify-between rounded-lg border border-border bg-card p-card text-body-md-strong text-foreground hover:bg-muted"
            >
              {job.label}
              <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
