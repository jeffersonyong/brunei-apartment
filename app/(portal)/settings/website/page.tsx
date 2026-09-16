import type { Metadata } from 'next'

import { EmptyState } from '@/components/portal/empty-state'
import { PageHeader } from '@/components/portal/page-header'
import type { Actor } from '@/lib/auth/require-permission'
import { getActor } from '@/lib/auth/require-permission'

import { faqsTab } from './faqs/faqs-tab'
import { photosTab } from './photos/photos-tab'
import { privacyPolicyTab } from './privacy-policy/privacy-policy-tab'
import { isWebsiteTab, websiteTabsFor, type WebsiteTab, type WebsiteTabView } from './website-tab'
import { WebsiteSettingsTabs } from './website-settings-tabs'

export const metadata: Metadata = {
  title: 'Website settings',
}

/**
 * What the public website shows and says (capabilities F7, F9, F10), one tab
 * per part, the way Property settings holds the business's figures.
 *
 * Unlike Property settings, whose four tabs answer to one permission and are
 * all read at once, each tab here answers to its own and reads its own data.
 * So the tab is the URL (`?tab=`), only the tabs somebody holds are shown, and
 * only the open one is read. Somebody holding none gets a quiet card and this
 * reads nothing. The gate that matters is on every action in each tab's
 * ./actions.ts; this one only spares somebody a screen they cannot use.
 */

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

const TAB_VIEWS: Record<WebsiteTab, (actor: Actor) => Promise<WebsiteTabView>> = {
  photos: photosTab,
  faqs: faqsTab,
  'privacy-policy': privacyPolicyTab,
}

const DESCRIPTION =
  'What the public website shows and says: its photographs, its questions and answers, and its privacy policy. Every change is recorded.'

export default async function WebsiteSettingsPage({ searchParams }: PageProps) {
  const actor = await getActor()
  const tabs = actor ? websiteTabsFor(actor.permissions) : []
  const [first] = tabs

  if (!actor || !first) {
    return (
      <>
        <PageHeader title="Website settings" description={DESCRIPTION} />
        <EmptyState
          className="mt-xl"
          title="You don't have access to this screen"
          description={
            'Changing the website needs one of the "Manage website photos", "Manage website FAQs" or "Write and publish the privacy policy" permissions. Ask an administrator if this is part of your job.'
          }
        />
      </>
    )
  }

  const { tab } = await searchParams
  // A tab somebody does not hold falls back to their first, rather than to a
  // refusal: a link from the audit log may name a tab another role can open.
  const active =
    tabs.find((candidate) => tab !== undefined && isWebsiteTab(tab) && candidate.id === tab) ??
    first
  const view = await TAB_VIEWS[active.id](actor)

  return (
    <>
      <PageHeader title="Website settings" description={DESCRIPTION} />

      <WebsiteSettingsTabs
        tabs={tabs.map(({ id, label }) => ({ id, label }))}
        active={active.id}
        actions={view.actions}
        lead={view.lead}
      >
        {view.content}
      </WebsiteSettingsTabs>
    </>
  )
}
