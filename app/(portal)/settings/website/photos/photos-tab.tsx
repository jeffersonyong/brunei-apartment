import type { Route } from 'next'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

import { ExportCsvButton } from '@/components/portal/export-csv'
import { SectionCard } from '@/components/portal/section-card'
import { Button } from '@/components/ui/button'
import { hasPermission } from '@/lib/auth/permissions'
import type { Actor } from '@/lib/auth/require-permission'
import { exportGroup } from '@/lib/db/export'
import { listCurrentSiteImages } from '@/lib/db/site-images'
import { listStaff } from '@/lib/db/staff'
import { env } from '@/lib/env'

import type { WebsiteTabView } from '../website-tab'

import { photoSections } from './photo-sections'
import { PhotoSlot } from './photo-slot'

/**
 * The photographs on the public website (capability F7) — the Photos tab of
 * Website settings.
 *
 * The screen shows this tab only to somebody holding `site_image.manage`; the
 * gate that matters is the first line of every action in ./actions.ts.
 *
 * The download sits behind `config.manage` like every other export, so a
 * member of staff trusted with the photographs but not with the business's
 * records sees no download here.
 */
export async function photosTab(actor: Actor): Promise<WebsiteTabView> {
  const [images, staff] = await Promise.all([listCurrentSiteImages(), listStaff()])
  const names = new Map(staff.map((account) => [account.id, account.displayName]))
  const sections = photoSections(images, (userId) => names.get(userId) ?? 'a former colleague')

  return {
    lead: 'The photographs on the public website, in the order the front page shows them. A change is live as soon as it is saved.',
    actions: (
      <>
        {hasPermission(actor.permissions, 'config.manage') ? (
          <ExportCsvButton tables={exportGroup('website')} />
        ) : null}
        <Button asChild variant="tertiary">
          {/* The site's own origin when the hosts are split: on the portal
              host `/` is the dashboard. */}
          <Link
            href={(env.hostSplit?.site ?? '/') as Route}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink aria-hidden />
            View the website
          </Link>
        </Button>
      </>
    ),
    content: (
      <div className="grid gap-xl">
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            id={`photos-${section.id}`}
            title={section.title}
            hint={section.hint}
          >
            <ul className="grid gap-lg sm:grid-cols-2 lg:grid-cols-4">
              {section.slots.map((slot) => (
                <li key={slot.key}>
                  <PhotoSlot slot={slot} />
                </li>
              ))}
            </ul>
          </SectionCard>
        ))}
      </div>
    ),
  }
}
