'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Route } from 'next'
import Link from 'next/link'
import {
  BadgeCheck,
  Bell,
  CalendarPlus,
  MailWarning,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'

import { markNotificationsSeenAction } from '@/app/(portal)/notifications/actions'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { elapsedMinutes, formatElapsed } from '@/lib/domain/dates'
import {
  NOTIFICATION_WINDOW_DAYS,
  formatUnreadCount,
  type NotificationKind,
  type PortalNotification,
} from '@/lib/domain/notifications'
import { cn } from '@/lib/utils'

/**
 * The bell in the panel header: the few events somebody at the desk should
 * hear about without going to look (lib/domain/notifications.ts).
 *
 * **Polled, not pushed.** The feed is read when the portal opens, every
 * minute after that while the tab is visible, and whenever the tab comes back
 * into view — enough for "a guest has just paid" at the pace a front desk
 * works, with no socket for a phone on poor signal to hold open.
 *
 * **Opening it marks what it shows seen** — up to the newest item, so
 * something that arrived since the last read still arrives as new — and
 * closing it does the same for anything that arrived while it was open. The
 * items that were new stay marked for as long as the panel is open, so the
 * reader can see which they were; the dot on the bell goes at once.
 *
 * The dot is ink, not a status hue: "something new" is not a state of the
 * business, and the operations surface is monochrome (design.md §Color).
 */

interface Feed {
  items: readonly PortalNotification[]
  seenAt: string | null
  unread: number
}

const POLL_MS = 60_000

const KIND_ICONS: Record<NotificationKind, LucideIcon> = {
  booking: CalendarPlus,
  payment: BadgeCheck,
  email: MailWarning,
  guests: UserPlus,
}

export function PortalNotifications() {
  const [feed, setFeed] = useState<Feed | null>(null)
  const [hasFailed, setHasFailed] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  // What counted as new when the panel was opened, held while it stays open.
  const [newSince, setNewSince] = useState<string | null>(null)
  const isOpenRef = useRef(false)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/notifications', { cache: 'no-store' })

      if (!response.ok) {
        throw new Error(`The feed answered ${response.status}`)
      }

      const next = (await response.json()) as Feed
      // While the panel is open, whatever arrives is being looked at.
      setFeed(isOpenRef.current ? { ...next, unread: 0 } : next)
      setHasFailed(false)
    } catch {
      setHasFailed(true)
    }
  }, [])

  useEffect(() => {
    // Deferred a tick so the first read is not a state update inside the
    // effect body itself.
    const first = window.setTimeout(() => void refresh(), 0)
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refresh()
      }
    }, POLL_MS)

    function onVisible() {
      if (document.visibilityState === 'visible') {
        void refresh()
      }
    }

    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearTimeout(first)
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  function onOpenChange(open: boolean) {
    setIsOpen(open)
    isOpenRef.current = open

    const newest = feed?.items[0]

    if (!open) {
      // Whatever arrived while the panel stayed open was on screen, so it is
      // seen too — or it would come back as new on the next load.
      if (newest && isAfter(newest.at, feed.seenAt)) {
        markSeen(newest.at)
      }

      return
    }

    setNewSince(feed?.seenAt ?? null)

    if (feed && newest && feed.unread > 0) {
      setFeed({ ...feed, unread: 0 })
      markSeen(newest.at)
    }
  }

  function markSeen(upTo: string) {
    void markNotificationsSeenAction(upTo).then((result) => {
      if (result.ok) {
        setFeed((current) => (current ? { ...current, seenAt: result.seenAt } : current))
      }
    })
  }

  const unread = feed?.unread ?? 0
  const badge = formatUnreadCount(unread)
  const newCount = feed ? feed.items.filter((item) => isNew(item, newSince)).length : 0

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={badge ? `Notifications, ${unread} new` : 'Notifications'}
          className="relative inline-flex size-control items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-panel data-[state=open]:bg-muted data-[state=open]:text-foreground"
        >
          <Bell aria-hidden className="size-4" />
          {badge ? (
            <span
              aria-hidden
              className="absolute top-1.5 right-1.5 size-2 rounded-full bg-foreground ring-2 ring-surface-panel"
            />
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" scale="menu" className="w-[min(360px,calc(100vw-32px))]">
        <div className="flex items-baseline justify-between gap-md border-b border-divider px-md py-sm">
          <p className="text-body-sm-strong text-foreground">Notifications</p>
          {feed ? (
            <p className="text-caption text-muted-foreground tabular-nums">
              {newCount > 0 ? `${newCount} new` : `Last ${NOTIFICATION_WINDOW_DAYS} days`}
            </p>
          ) : null}
        </div>

        <NotificationList
          feed={feed}
          hasFailed={hasFailed}
          newSince={newSince}
          onChoose={() => onOpenChange(false)}
        />
      </PopoverContent>
    </Popover>
  )
}

function isNew(item: PortalNotification, since: string | null): boolean {
  return isAfter(item.at, since)
}

function isAfter(instant: string, since: string | null): boolean {
  return since === null || new Date(instant).getTime() > new Date(since).getTime()
}

interface NotificationListProps {
  feed: Feed | null
  hasFailed: boolean
  newSince: string | null
  onChoose: () => void
}

function NotificationList({ feed, hasFailed, newSince, onChoose }: NotificationListProps) {
  if (!feed) {
    return (
      <p className="px-md py-lg text-body-sm text-muted-foreground">
        {hasFailed ? 'Notifications could not be loaded. They will try again shortly.' : 'Loading…'}
      </p>
    )
  }

  if (feed.items.length === 0) {
    return (
      <p className="px-md py-lg text-body-sm text-muted-foreground">
        Nothing in the last {NOTIFICATION_WINDOW_DAYS} days. New website bookings, payments to
        verify and emails that could not be sent will show here.
      </p>
    )
  }

  return (
    <ul className="max-h-[min(420px,60dvh)] divide-y divide-divider overflow-y-auto">
      {feed.items.map((item) => (
        <li key={item.id}>
          <NotificationRow item={item} isNew={isNew(item, newSince)} onChoose={onChoose} />
        </li>
      ))}
    </ul>
  )
}

interface NotificationRowProps {
  item: PortalNotification
  isNew: boolean
  onChoose: () => void
}

function NotificationRow({ item, isNew: isItemNew, onChoose }: NotificationRowProps) {
  const Icon = KIND_ICONS[item.kind]
  const body = (
    <>
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block text-body-sm-strong text-foreground">{item.title}</span>
        <span className="block truncate text-caption text-muted-foreground">{item.detail}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-xs">
        <time dateTime={item.at} className="text-caption text-muted-foreground tabular-nums">
          {formatElapsed(elapsedMinutes(item.at))}
        </time>
        {isItemNew ? (
          <span className="size-1.5 rounded-full bg-foreground">
            <span className="sr-only">New</span>
          </span>
        ) : null}
      </span>
    </>
  )
  const rowClasses = 'flex items-start gap-sm px-md py-sm'

  if (item.href === null) {
    return <div className={rowClasses}>{body}</div>
  }

  return (
    <Link
      href={item.href as Route}
      onClick={onChoose}
      className={cn(
        rowClasses,
        'transition-colors outline-none hover:bg-muted focus-visible:bg-muted',
      )}
    >
      {body}
    </Link>
  )
}
