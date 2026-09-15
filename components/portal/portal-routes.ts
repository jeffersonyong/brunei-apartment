import {
  BadgeCheck,
  Banknote,
  BarChart3,
  Building2,
  CalendarDays,
  Coins,
  DoorOpen,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  List,
  LockKeyhole,
  MessageCircleQuestion,
  Plus,
  ScrollText,
  Settings,
  ShieldCheck,
  Smartphone,
  Tag,
  Users,
  type LucideIcon,
} from 'lucide-react'

/**
 * The portal's route map — one source of truth for the sidebar, the mobile
 * drawer and the topbar breadcrumbs.
 *
 * The groups map to how the work is divided rather than to the route tree, so
 * the shape of the operation is legible from the sidebar. Screens that are not
 * built yet are listed and render a planned-screen stub — the remaining work is
 * visible instead of hidden.
 */

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

export interface NavGroup {
  /** Rendered as a micro label above the group. */
  label: string
  items: readonly NavItem[]
  /**
   * Links out of the portal, drawn after the group's own items. Not portal
   * screens, so `activeHref` never matches them and no breadcrumb names them.
   */
  exits?: readonly NavItem[]
}

/**
 * The ways out of the portal: the public site and the field screens.
 *
 * Escape hatches to the other two surfaces rather than portal destinations, so
 * they never take the active chip. They close the Others group, under Settings
 * (Jeff, 13 September 2026) — they sat in the sidebar footer beside the account
 * until then, where they read as part of who is signed in.
 */
export const portalExitLinks = [
  { href: '/', label: 'Public site', icon: Globe },
  { href: '/field', label: 'Field screens', icon: Smartphone },
] as const satisfies readonly NavItem[]

// `as const` keeps the hrefs as literals so Next's typed routes can check them;
// `satisfies` still enforces the shape.
export const navGroups = [
  { label: 'Overview', items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    label: 'Bookings',
    items: [
      { href: '/bookings', label: 'All bookings', icon: List },
      { href: '/bookings/calendar', label: 'Calendar', icon: CalendarDays },
      { href: '/bookings/new', label: 'New booking', icon: Plus },
    ],
  },
  {
    label: 'Payments',
    items: [
      { href: '/payments', label: 'Verification queue', icon: BadgeCheck },
      { href: '/payments/cash', label: 'Cash payments', icon: Banknote },
    ],
  },
  /**
   * Property holds one screen today and will hold more — facilities, and
   * whatever housekeeping and long-stay bring — which is why it is a group
   * rather than a lone item filed under Admin. Units is a daily operations
   * screen, and Admin is where the business is configured.
   */
  { label: 'Property', items: [{ href: '/units', label: 'Units', icon: DoorOpen }] },
  {
    label: 'Finance',
    items: [
      { href: '/deposits', label: 'Deposits', icon: LockKeyhole },
      { href: '/reports', label: 'Reports', icon: BarChart3 },
      // Its own item rather than a tab inside Reports: the cash-up is worked
      // daily and the reports are read occasionally, so filing it behind a
      // screen somebody opens once a month would bury the one Finance uses
      // most. Every day beneath it (`/reports/cash-up/<date>`) lights
      // this item, since activeHref matches the longest listed prefix.
      { href: '/reports/cash-up', label: 'Daily cash-up', icon: Coins },
    ],
  },
  {
    label: 'Admin',
    items: [
      { href: '/settings/property', label: 'Property settings', icon: Tag },
      // Under Admin rather than beside Units in Property, deliberately. The
      // Units board is a daily operations screen; naming the building is
      // configuration and is gated on `config.manage`. The board links across
      // to it, which is where anyone looking for it will look first.
      { href: '/settings/units', label: 'Unit registry', icon: Building2 },
      // The public site's photographs (capability F7). They were a Website
      // group of one, and a label over a single screen that will not be
      // joined is chrome rather than structure — the photos are what the
      // business shows the public, configured once and refreshed now and then,
      // the same kind of work as the rates above them. The group names that
      // work, not who may do it: the screen answers to `site_image.manage`,
      // which whoever runs the Instagram account can hold without being an
      // administrator.
      { href: '/website/photos', label: 'Website photos', icon: ImageIcon },
      // Beside the photos, for the same reason they are here: what the public
      // site says, kept current now and then. Its own permission,
      // `faq.manage` (capability F9).
      { href: '/website/faqs', label: 'Website FAQs', icon: MessageCircleQuestion },
      // Beside the other two for the same reason: what the public site says.
      // Its own permission, `privacy_policy.manage` (capability F10).
      {
        href: '/website/privacy-policy',
        label: 'Privacy policy',
        icon: ShieldCheck,
      },
      { href: '/settings/roles', label: 'Roles & staff', icon: Users },
      { href: '/settings/audit', label: 'Audit log', icon: ScrollText },
      // No "Export data" item. The screen it pointed at listed seventeen table
      // names with a Download beside each, which is a schema browser filed
      // under Admin; every table is now taken from the screen holding its
      // records (lib/db/export.ts — EXPORT_GROUPS), and `/export` is a
      // route with no page.
    ],
  },
  /**
   * Settings is not Admin: that group configures the business, while this is
   * where anyone signed in looks after their own account — their name, their
   * password, what they have been given access to. It belongs to no area of
   * the work, so it closes the nav under the catch-all label rather than
   * borrowing a permission it does not need.
   *
   * Addressed `/account`, not `/settings`: the admin screens
   * share that prefix, and a person's own account is not their parent.
   *
   * It ends with the ways out of the portal, for the same reason it holds
   * Settings: they belong to no area of the work.
   */
  {
    label: 'Others',
    items: [{ href: '/account', label: 'Settings', icon: Settings }],
    exits: portalExitLinks,
  },
] as const satisfies readonly NavGroup[]

// Items only: a group's exits are not portal screens, so they never light up
// and never appear in a breadcrumb.
const allHrefs = navGroups.flatMap((group) => group.items.map((item) => item.href))

/**
 * The active item is the longest listed route that prefixes the current path.
 *
 * A plain `startsWith` would light up both "All bookings" and "New booking" on
 * `/bookings/new`; matching the longest wins picks the specific one.
 *
 * The match is on whole segments: a bare `startsWith` would also treat
 * `/bookings-report` as a child of `/bookings` and light up the
 * wrong item.
 */
export function activeHref(pathname: string): string | null {
  return allHrefs.reduce<string | null>((best, href) => {
    const matches = pathname === href || pathname.startsWith(`${href}/`)

    if (!matches) return best

    return best === null || href.length > best.length ? href : best
  }, null)
}

/**
 * The literal union of every listed portal route, derived from the data above
 * so it cannot drift. Next's typed routes reject a widened `string`, and this
 * keeps crumb links checkable without restating the route list.
 */
type PortalHref = (typeof navGroups)[number]['items'][number]['href']

export interface Crumb {
  label: string
  /** Absent for the current page and for group names, which are not routes. */
  href?: PortalHref
}

/**
 * The trail for the topbar: Portal → group → screen.
 *
 * Group names carry no href — they organise the sidebar, they are not pages —
 * so they render as plain text. An unrecognised path yields just the root
 * crumb rather than guessing labels from URL segments.
 */
export function breadcrumbTrail(pathname: string): Crumb[] {
  const active = activeHref(pathname)

  if (active === null || active === '/dashboard') {
    return [{ label: 'Portal' }]
  }

  const group = navGroups.find((candidate) => candidate.items.some((item) => item.href === active))
  const item = group?.items.find((candidate) => candidate.href === active)

  if (!group || !item) {
    return [{ label: 'Portal' }]
  }

  return [{ label: 'Portal', href: '/dashboard' }, { label: group.label }, { label: item.label }]
}
