import type { Route } from 'next'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

import { ExportCsvButton } from '@/components/portal/export-csv'
import { SectionCard } from '@/components/portal/section-card'
import { Button } from '@/components/ui/button'
import { hasPermission } from '@/lib/auth/permissions'
import type { Actor } from '@/lib/auth/require-permission'
import { exportGroup } from '@/lib/db/export'
import { readFoodNotice } from '@/lib/db/food-notice'
import { listCurrentSiteImages } from '@/lib/db/site-images'
import { listStaff } from '@/lib/db/staff'
import { isFoodNoticeShown } from '@/lib/domain/food-notice'
import { env } from '@/lib/env'

import { photoSlotView } from '../photos/photo-sections'
import { PhotoSlot } from '../photos/photo-slot'
import type { WebsiteTabView } from '../website-tab'

import { FoodNoticeEditor } from './food-notice-editor'

/**
 * What guests are told about food (Jeff, 19 September 2026) — the Food tab of
 * Website settings.
 *
 * There is no restaurant at Palm Villa; an outside provider leaves a menu at
 * the pool and delivers. The provider can change, so both halves are here:
 * the words and number, and the menu flyer, which is a photograph placed
 * through the Photos tab's own actions and dialogs.
 *
 * The screen shows this tab only to somebody holding `site_image.manage`; the
 * gate that matters is the first line of every action.
 */
export async function foodTab(actor: Actor): Promise<WebsiteTabView> {
  const [notice, images, staff] = await Promise.all([
    readFoodNotice(),
    listCurrentSiteImages(),
    listStaff(),
  ])
  const names = new Map(staff.map((account) => [account.id, account.displayName]))
  const flyer = photoSlotView(
    images,
    (userId) => names.get(userId) ?? 'a former colleague',
    { kind: 'slot', slot: 'food-menu' },
    'Food menu',
  )
  // The site's own origin when the hosts are split: on the portal host the
  // path would be a portal route.
  const foodPage = `${env.hostSplit?.site ?? ''}/food`

  return {
    lead: 'What a confirmed guest is told about food, on their booking page, in their confirmation email and on the food page. A change is live as soon as it is saved.',
    actions: (
      <>
        {/* Behind `config.manage` like every other export (the Photos tab's rule). */}
        {hasPermission(actor.permissions, 'config.manage') ? (
          <ExportCsvButton tables={exportGroup('food')} />
        ) : null}
        {isFoodNoticeShown(notice) ? (
          <Button asChild variant="tertiary">
            <Link href={foodPage as Route} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden />
              View the food page
            </Link>
          </Button>
        ) : null}
      </>
    ),
    content: (
      <div className="grid items-start gap-xl lg:grid-cols-[minmax(0,1fr)_280px]">
        <SectionCard
          id="food-notice"
          title="Notice"
          hint="There is no restaurant at Palm Villa, so guests are told how to order in. Change it when the provider or their terms change."
        >
          <FoodNoticeEditor notice={notice} />
        </SectionCard>

        <SectionCard
          id="food-menu"
          title="Menu flyer"
          hint="The provider's flyer, shown whole on the food page. The email and the booking page link to it."
        >
          <PhotoSlot slot={flyer} />
        </SectionCard>
      </div>
    ),
  }
}
