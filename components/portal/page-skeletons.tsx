import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderRow,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

/**
 * What a portal screen looks like before its data arrives (design.md
 * §Skeletons), in the shapes the screens are actually built from.
 *
 * Each route's `loading.tsx` composes these. Next shows that file the moment a
 * link is followed — it is prefetched with the link — so the panel changes on
 * the click instead of sitting on the old screen until the server has read
 * everything the new one needs.
 *
 * ── What is real and what is a placeholder ────────────────────────────────
 *
 * **The title is real** wherever the screen's title is a fixed word, because it
 * is the one thing that says the click landed on the right screen. Everything
 * the server has to read — descriptions included, which some screens build from
 * data — is a placeholder. Table headers are drawn as the strip alone, without
 * their labels: a copy of each screen's columns here would drift from the
 * screen the first time a column changed.
 *
 * **Sizes follow the real thing** — a tile is the height of a tile, a row the
 * height of a row — so the arriving screen replaces the placeholder in place
 * rather than shoving the page down.
 *
 * The skeleton bars are `aria-hidden` (see Skeleton). `LoadingScreen` carries
 * the one sentence a screen reader hears instead.
 */

/** Wraps a whole placeholder screen and announces it once. */
export function LoadingScreen({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status">
      <span className="sr-only">Loading {label}…</span>
      {children}
    </div>
  )
}

/**
 * The page header. A fixed `title` is printed as itself; without one — a
 * booking reference, a unit — the title is a bar the height of the heading.
 */
export function PageHeaderSkeleton({
  title,
  description = true,
  actions = 0,
}: {
  title?: string
  /** Whether the screen has a description line under its title. */
  description?: boolean
  /** How many buttons sit at the header's right. */
  actions?: number
}) {
  // PageHeader's own markup rather than PageHeader itself: it wraps the
  // description in a `<p>`, and a skeleton is a `<div>`, which a paragraph may
  // not hold — the browser would split it and hydration would fail.
  return (
    <header className="flex flex-wrap items-end justify-between gap-lg">
      <div className="min-w-0">
        {title ? (
          <h1 className="text-display-sm text-foreground">{title}</h1>
        ) : (
          <Skeleton className="h-7 w-40" />
        )}
        {description ? <Skeleton className="mt-xs h-4 w-[min(420px,70vw)]" /> : null}
      </div>
      {actions > 0 ? (
        <div className="flex items-center gap-sm">
          {Array.from({ length: actions }, (_, index) => (
            <Skeleton key={index} className="h-control w-28" />
          ))}
        </div>
      ) : null}
    </header>
  )
}

/** A row of stat tiles — the figures a list screen opens with. */
export function StatTilesSkeleton({
  count,
  className = 'grid-cols-3',
}: {
  count: number
  /** The grid's column classes, matching the screen's own tiles. */
  className?: string
}) {
  return (
    <div className={cn('mt-xl grid gap-md', className)}>
      {Array.from({ length: count }, (_, index) => (
        <Card key={index}>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-xs h-7 w-12" />
        </Card>
      ))}
    </div>
  )
}

/** The control line above a table: filter chips on the left, actions on the right. */
export function ControlRowSkeleton({
  chips = 3,
  actions = 1,
}: {
  chips?: number
  actions?: number
}) {
  return (
    <div className="mt-md flex flex-wrap items-center gap-md">
      <div className="flex flex-wrap items-center gap-sm">
        {Array.from({ length: chips }, (_, index) => (
          <Skeleton key={index} className={cn('h-control', index === 0 ? 'w-56' : 'w-24')} />
        ))}
      </div>
      {actions > 0 ? (
        <div className="ml-auto flex items-center gap-sm">
          {Array.from({ length: actions }, (_, index) => (
            <Skeleton key={index} className="h-control w-32" />
          ))}
        </div>
      ) : null}
    </div>
  )
}

/**
 * A table in its real container, with placeholder rows.
 *
 * The first column is narrower and the rest vary in width, so the block reads
 * as rows of data rather than a stripe pattern.
 */
export function TableSkeleton({
  columns,
  rows = 8,
  className,
}: {
  columns: number
  rows?: number
  className?: string
}) {
  const widths = ['w-20', 'w-32', 'w-16', 'w-24', 'w-28', 'w-12']

  return (
    <Table containerClassName={cn('mt-md', className)}>
      <TableHeader>
        <TableHeaderRow>
          {/* The strip alone, at a header's height — see the file comment. */}
          <th colSpan={columns} className="px-lg py-sm micro-label">
            &nbsp;
          </th>
        </TableHeaderRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }, (_, row) => (
          <TableRow key={row} className="hover:bg-transparent">
            {Array.from({ length: columns }, (_, column) => (
              <TableCell key={column}>
                <Skeleton className={cn('h-4', widths[(row + column) % widths.length])} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/** A list screen: header, optional tiles, the control line, then the table. */
export function ListScreenSkeleton({
  title,
  description = true,
  tiles = 0,
  tilesClassName,
  chips = 3,
  actions = 1,
  columns,
}: {
  title: string
  description?: boolean
  tiles?: number
  tilesClassName?: string
  chips?: number
  actions?: number
  columns: number
}) {
  return (
    <LoadingScreen label={title}>
      <PageHeaderSkeleton title={title} description={description} />
      {tiles > 0 ? <StatTilesSkeleton count={tiles} className={tilesClassName} /> : null}
      <div className={tiles > 0 ? undefined : 'mt-xl'}>
        <ControlRowSkeleton chips={chips} actions={actions} />
      </div>
      <TableSkeleton columns={columns} />
    </LoadingScreen>
  )
}

/** A card holding a section: its micro label, then a few lines of content. */
export function SectionCardSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <Card>
      <Skeleton className="h-3 w-24" />
      <div className="mt-md grid gap-sm">
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton key={index} className={cn('h-4', index % 2 === 0 ? 'w-3/4' : 'w-1/2')} />
        ))}
      </div>
    </Card>
  )
}

/**
 * A record screen — a booking, a deposit, a unit: a header whose title is the
 * record's own reference, then its sections two to a row.
 */
export function RecordScreenSkeleton({
  label,
  sections = 4,
  actions = 2,
}: {
  label: string
  sections?: number
  actions?: number
}) {
  return (
    <LoadingScreen label={label}>
      <div className="max-w-[1120px]">
        <PageHeaderSkeleton actions={actions} />
        <div className="mt-lg grid gap-lg lg:grid-cols-2">
          {Array.from({ length: sections }, (_, index) => (
            <SectionCardSkeleton key={index} lines={index % 2 === 0 ? 5 : 3} />
          ))}
        </div>
      </div>
    </LoadingScreen>
  )
}

/** A form screen: labelled fields in a card. */
export function FormScreenSkeleton({
  title,
  label = title ?? 'form',
  fields = 6,
  description = true,
}: {
  title?: string
  label?: string
  fields?: number
  description?: boolean
}) {
  return (
    <LoadingScreen label={label}>
      <PageHeaderSkeleton title={title} description={description} />
      <Card className="mt-xl max-w-[720px]">
        <div className="grid gap-lg">
          {Array.from({ length: fields }, (_, index) => (
            <div key={index}>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-xs h-control w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-xl h-control w-32" />
      </Card>
    </LoadingScreen>
  )
}

/** A settings screen that is all tabs: the tab track, then a card of fields. */
export function TabbedScreenSkeleton({ title, tabs = 4 }: { title: string; tabs?: number }) {
  return (
    <LoadingScreen label={title}>
      <PageHeaderSkeleton title={title} />
      <div className="mt-xl flex gap-xs">
        {Array.from({ length: tabs }, (_, index) => (
          <Skeleton key={index} className="h-control w-28" />
        ))}
      </div>
      <div className="mt-lg grid gap-lg">
        <SectionCardSkeleton lines={4} />
        <SectionCardSkeleton lines={3} />
      </div>
    </LoadingScreen>
  )
}
