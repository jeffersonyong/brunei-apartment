'use client'

import { useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PropertySettings } from '@/lib/domain/settings'

import type { PropertyTab } from './property-tabs'

import { BankAccountsTab } from './bank-accounts-tab'
import { DayPassTab } from './day-pass-tab'
import { DocumentsTab } from './documents-tab'
import { ExtrasTab } from './extras/extras-tab'
import { PricingTab } from './pricing-tab'

/**
 * The five things a settings screen is (capabilities F3 and F13).
 *
 * Tabs rather than one long form because they are separate saves against
 * separate parts of the configuration: a half-finished day-pass price list
 * should not block correcting a nightly rate.
 *
 * Extras is the odd one and says so in its own file — it is a list of rows
 * with their own writers, not a form with a concurrency token.
 *
 * Each tab is mounted only while it is showing, so it takes its draft from the
 * settings the server just read — and a save's own response re-renders the
 * page, since every settings action revalidates it, which hands every tab the
 * new concurrency token as fresh props.
 */

interface PropertySettingsTabsProps {
  settings: PropertySettings
  initialTab: PropertyTab
  /**
   * What sits at the end of the tab row, level with the tabs and directly
   * above the table — the screen's CSV export.
   */
  actions?: React.ReactNode
}

export function PropertySettingsTabs({ settings, initialTab, actions }: PropertySettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab)

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-xl">
      {/* The Roles & staff construction: tabs on the left, the row's action at
          the right edge, so the export lines up with what it exports. */}
      <div className="flex flex-wrap items-center justify-between gap-lg">
        <TabsList aria-label="Which settings to edit">
          <TabsTrigger value="pricing">Rates</TabsTrigger>
          <TabsTrigger value="extras">Extras</TabsTrigger>
          <TabsTrigger value="day-pass">Day pass</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="bank-accounts">Bank accounts</TabsTrigger>
        </TabsList>

        {actions}
      </div>

      <TabsContent value="pricing">
        <PricingTab settings={settings} />
      </TabsContent>

      <TabsContent value="extras">
        <ExtrasTab extras={settings.extras} />
      </TabsContent>

      <TabsContent value="day-pass">
        <DayPassTab settings={settings} />
      </TabsContent>

      <TabsContent value="documents">
        <DocumentsTab settings={settings} />
      </TabsContent>

      <TabsContent value="bank-accounts">
        <BankAccountsTab settings={settings} />
      </TabsContent>
    </Tabs>
  )
}
