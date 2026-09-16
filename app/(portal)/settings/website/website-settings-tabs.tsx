'use client'

import { useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { Route } from 'next'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

import type { WebsiteTab } from './website-tab'

/**
 * The Website settings tab row and the open tab.
 *
 * The switcher on the left and the open tab's buttons on the right share one
 * line, the construction Roles & staff uses, so a tab never carries a button
 * that acts on another. The tab is the URL rather than local state because
 * each tab reads its own data on the server: choosing one navigates, and the
 * chip moves at once while the old body stays, dimmed, until the new one
 * arrives.
 */

interface WebsiteSettingsTabsProps {
  tabs: readonly { id: WebsiteTab; label: string }[]
  active: WebsiteTab
  actions: React.ReactNode
  lead: string
  children: React.ReactNode
}

export function WebsiteSettingsTabs({
  tabs,
  active,
  actions,
  lead,
  children,
}: WebsiteSettingsTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [requested, setRequested] = useState<string>(active)
  const shown = isPending ? requested : active

  function onValueChange(value: string) {
    setRequested(value)
    startTransition(() => {
      router.push(`${pathname}?tab=${value}` as Route, { scroll: false })
    })
  }

  return (
    <Tabs value={shown} onValueChange={onValueChange} className="mt-xl">
      <div className="flex flex-wrap items-center justify-between gap-lg">
        <TabsList aria-label="Which part of the website to edit">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {isPending ? null : <div className="flex flex-wrap items-center gap-sm">{actions}</div>}
      </div>

      {/* Only the open tab has a body: the others are read when chosen. */}
      <TabsContent
        value={active}
        forceMount
        aria-busy={isPending || undefined}
        className={cn('transition-opacity', isPending && 'pointer-events-none opacity-60')}
      >
        <p className="mb-lg text-body-sm text-muted-foreground">{lead}</p>
        {children}
      </TabsContent>
    </Tabs>
  )
}
