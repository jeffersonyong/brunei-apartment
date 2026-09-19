import type { ReactNode } from 'react'

import type { Permission } from '@/lib/auth/permissions'

/**
 * The tabs of the Website settings screen (capabilities F7, F9, F10, F14).
 *
 * A plain module with no `'use client'`, for the reason property-tabs.ts
 * records: the server page calls `isWebsiteTab` to read `?tab=`, and a
 * function exported from a client module arrives in a server component as a
 * reference, not as something it can run.
 *
 * Each tab answers to its own permission, so the screen shows only the tabs
 * somebody holds — whoever runs the Instagram account can be given the photos
 * without the privacy policy.
 */

export const WEBSITE_TABS = [
  { id: 'photos', label: 'Photos', permission: 'site_image.manage' },
  { id: 'faqs', label: 'FAQs', permission: 'faq.manage' },
  { id: 'privacy-policy', label: 'Privacy policy', permission: 'privacy_policy.manage' },
  // The flyer's own permission: the notice is its caption (20261006000200).
  { id: 'food', label: 'Food', permission: 'site_image.manage' },
] as const satisfies readonly { id: string; label: string; permission: Permission }[]

export type WebsiteTab = (typeof WEBSITE_TABS)[number]['id']

export function isWebsiteTab(value: string): value is WebsiteTab {
  return WEBSITE_TABS.some((tab) => tab.id === value)
}

/** The tabs somebody holding `permissions` may open, in screen order. */
export function websiteTabsFor(permissions: ReadonlySet<Permission>) {
  return WEBSITE_TABS.filter((tab) => permissions.has(tab.permission))
}

/**
 * What a tab puts on the screen: the buttons on the right of the tab row, a
 * sentence on how its changes reach the site, and the tab's body.
 */
export interface WebsiteTabView {
  actions: ReactNode
  lead: string
  content: ReactNode
}
