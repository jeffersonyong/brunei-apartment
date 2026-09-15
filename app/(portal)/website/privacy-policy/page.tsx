import type { Metadata } from 'next'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

import { EmptyState } from '@/components/portal/empty-state'
import { ExportCsvButton } from '@/components/portal/export-csv'
import { PageHeader } from '@/components/portal/page-header'
import { SectionCard } from '@/components/portal/section-card'
import { Button } from '@/components/ui/button'
import { hasPermission } from '@/lib/auth/permissions'
import { getActor } from '@/lib/auth/require-permission'
import { exportGroup } from '@/lib/db/export'
import {
  listPrivacyPolicyVersions,
  readPrivacyPolicyDraft,
  readPublishedPrivacyPolicy,
} from '@/lib/db/privacy-policy'
import { listStaff } from '@/lib/db/staff'
import { contact } from '@/lib/domain/contact'
import { formatTimestamp } from '@/lib/domain/dates'
import { privacyPolicyStatus, type PrivacyPolicyStatus } from '@/lib/domain/privacy-policy'
import { privacyPolicyTemplate } from '@/lib/domain/privacy-policy-template'

import { PrivacyPolicyEditor } from './privacy-policy-editor'

export const metadata: Metadata = {
  title: 'Privacy policy',
}

/**
 * The privacy policy on the public website (capability F10).
 *
 * Render-gated on `privacy_policy.manage`, the way Website FAQs is gated on
 * `faq.manage`: somebody without it gets a quiet card and this reads nothing.
 * The gate that matters is the first line of both actions in ./actions.ts.
 *
 * Three parts, in the order somebody needs them: where the website stands now,
 * the editor, and the versions the website has shown. **The wording is the
 * client's to approve** — the screen offers a template and refuses to publish
 * an unfilled gap, and makes no claim beyond that (open question R5).
 */
export default async function WebsitePrivacyPolicyPage() {
  const actor = await getActor()

  if (!actor || !hasPermission(actor.permissions, 'privacy_policy.manage')) {
    return (
      <>
        <PageHeader
          title="Privacy policy"
          description="What the public website tells guests about their personal data."
        />
        <EmptyState
          className="mt-xl"
          title="You don't have access to this screen"
          description={
            'Changing the privacy policy needs the "Write and publish the privacy policy" permission. Ask an administrator if this is part of your job.'
          }
        />
      </>
    )
  }

  const [draft, published, versions, staff] = await Promise.all([
    readPrivacyPolicyDraft(),
    readPublishedPrivacyPolicy(),
    listPrivacyPolicyVersions(),
    listStaff(),
  ])
  const names = new Map(staff.map((account) => [account.id, account.displayName]))
  const nameOf = (id: string | null) =>
    (id === null ? undefined : names.get(id)) ?? 'a former colleague'
  const status = privacyPolicyStatus({ draft: draft.text, published: published?.body ?? null })

  return (
    <>
      <PageHeader
        title="Privacy policy"
        description="What the public website tells guests about their personal data. Nothing on the website changes until you publish."
        actions={
          <>
            {hasPermission(actor.permissions, 'config.manage') ? (
              <ExportCsvButton tables={exportGroup('privacyPolicy')} />
            ) : null}
            {published ? (
              <Button asChild variant="tertiary">
                <Link href="/privacy" target="_blank" rel="noopener noreferrer">
                  <ExternalLink aria-hidden />
                  View the privacy policy page
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="mt-xl grid gap-xl">
        <SectionCard id="privacy-policy-status" title="On the website">
          <p className="text-body-md text-foreground">
            {statusSentence(
              status,
              published && {
                at: formatTimestamp(published.publishedAt),
                by: nameOf(published.publishedBy),
              },
            )}
          </p>
        </SectionCard>

        {/* Keyed on the saved draft, so a save or a publish that moved it
            starts the editor again from what is now saved. */}
        <PrivacyPolicyEditor
          key={draft.updatedAt ?? 'never-saved'}
          savedText={draft.text}
          savedAt={draft.updatedAt}
          publishedText={published?.body ?? null}
          template={privacyPolicyTemplate(contact)}
        />

        {versions.length > 0 ? (
          <SectionCard
            id="privacy-policy-versions"
            title="Published versions"
            hint="Every version the website has shown, newest first. What each one said is kept, and is in the download."
          >
            <ol className="divide-y divide-divider">
              {versions.map((version, index) => (
                <li
                  key={version.id}
                  className="flex flex-wrap items-baseline justify-between gap-sm py-sm first:pt-0 last:pb-0"
                >
                  <span className="text-body-md text-foreground tabular-nums">
                    {formatTimestamp(version.publishedAt)}
                  </span>
                  <span className="text-body-sm text-muted-foreground">
                    {index === 0 ? 'On the website now · ' : ''}Published by{' '}
                    {nameOf(version.publishedBy)}
                  </span>
                </li>
              ))}
            </ol>
          </SectionCard>
        ) : null}
      </div>
    </>
  )
}

function statusSentence(
  status: PrivacyPolicyStatus,
  published: { at: string; by: string } | null,
): string {
  if (status === 'unpublished' || published === null) {
    return 'Not published. The Privacy policy link at the foot of the website does nothing until you publish one.'
  }

  const when = `Published ${published.at} by ${published.by}.`

  return status === 'published'
    ? `${when} The website shows the policy below.`
    : `${when} Your saved draft below has changes the website does not show yet.`
}
