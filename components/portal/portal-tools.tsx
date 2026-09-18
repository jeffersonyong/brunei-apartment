'use client'

import { HelpDeskLink } from '@/components/portal/help-desk-link'
import { PortalNotifications } from '@/components/portal/portal-notifications'
import { ThemeToggle } from '@/components/theme-toggle'
import { TooltipProvider } from '@/components/ui/tooltip'

/**
 * The tools that belong to no single screen, on the right of the panel header
 * opposite the breadcrumb.
 *
 * One tooltip provider for the row, so a tooltip in any of them shares the
 * skip-delay rather than re-paying the open delay.
 */
export function PortalTools() {
  return (
    <TooltipProvider>
      <div className="flex shrink-0 items-center gap-xxs">
        <HelpDeskLink />
        <PortalNotifications />
        <ThemeToggle />
      </div>
    </TooltipProvider>
  )
}
