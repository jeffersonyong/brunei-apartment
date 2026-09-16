'use client'

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

import type { SearchGroup, SearchHit } from '@/components/portal/portal-search-results'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/**
 * The header search (capability F12): screens, bookings, payments waiting to
 * be checked, deposits and units, from one box.
 *
 * Opened by the bar or by ⌘K / Ctrl K. It asks as the reader types — after a
 * short pause, with the previous question cancelled — and the arrow keys and
 * Enter move through the results without leaving the box, the combobox
 * pattern. What each group holds, and who sees it, is
 * portal-search-results.ts; the list screens hold anything past the first few.
 *
 * The trigger is a button styled as an input rather than an input: it cannot
 * be typed into, so it should not look focusable in place.
 */

interface Results {
  term: string
  groups: readonly SearchGroup[]
}

type Phase = 'idle' | 'searching' | 'done' | 'failed'

const PAUSE_MS = 200

function subscribeToNothing() {
  return () => {}
}

function isApplePlatform() {
  return /Mac|iPhone|iPad/.test(navigator.userAgent)
}

export function PortalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  // Read after hydration: the server cannot know the reader's keyboard.
  const isApple = useSyncExternalStore(subscribeToNothing, isApplePlatform, () => true)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return

      event.preventDefault()
      setIsOpen((open) => !open)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-keyshortcuts={isApple ? 'Meta+K' : 'Control+K'}
        className="hidden h-control w-72 items-center gap-sm rounded-md border border-border bg-card px-md text-body-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-panel md:flex"
      >
        <Search aria-hidden className="size-4 shrink-0" />
        Search
        <kbd className="ml-auto rounded-sm border border-border bg-muted px-xs py-xxs text-caption text-muted-foreground">
          {isApple ? '⌘K' : 'Ctrl K'}
        </kbd>
      </button>

      {/* Below `md` the faux input costs more width than it earns. */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Search"
        className="inline-flex size-control items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-panel md:hidden"
      >
        <Search aria-hidden className="size-4" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {/* Anchored high rather than centred: a search panel belongs near the
            bar that opened it, and its height changes as results arrive. */}
        <DialogContent
          showCloseButton={false}
          className="top-[12%] max-w-[600px] translate-y-0 gap-0 overflow-hidden p-0"
        >
          <DialogTitle className="sr-only">Search the portal</DialogTitle>
          <DialogDescription className="sr-only">
            Find a booking, payment, deposit or unit by reference, guest name, phone or unit, or go
            to a screen by its name.
          </DialogDescription>
          {/* Mounted with the dialog, so every opening starts empty. */}
          {isOpen ? <SearchPanel onClose={() => setIsOpen(false)} /> : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const listId = useId()
  const [term, setTerm] = useState('')
  const [results, setResults] = useState<Results | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const trimmed = term.trim()

  useEffect(() => {
    if (trimmed.length === 0) {
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setPhase('searching')

      try {
        const response = await fetch(`/search?q=${encodeURIComponent(trimmed)}`, {
          cache: 'no-store',
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Search answered ${response.status}`)
        }

        setResults((await response.json()) as Results)
        setActiveIndex(0)
        setPhase('done')
      } catch {
        // A cancelled question is the next keystroke, not a failure.
        if (!controller.signal.aborted) {
          setPhase('failed')
        }
      }
    }, PAUSE_MS)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [trimmed])

  const shown = trimmed.length > 0 ? results : null
  const hits = shown?.groups.flatMap((group) => group.hits) ?? []
  const active = hits[Math.min(activeIndex, hits.length - 1)]

  function open(hit: SearchHit) {
    onClose()
    router.push(hit.href as Route)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (hits.length === 0) return

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      const next = (activeIndex + step + hits.length) % hits.length

      setActiveIndex(next)
      listRef.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: 'nearest' })
    } else if (event.key === 'Enter' && active) {
      event.preventDefault()
      open(active)
    }
  }

  return (
    <>
      <div className="flex items-center gap-sm border-b border-divider px-lg">
        <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          type="search"
          role="combobox"
          aria-label="Search the portal"
          aria-expanded={hits.length > 0}
          aria-controls={listId}
          aria-activedescendant={active ? `${listId}-${active.id}` : undefined}
          aria-autocomplete="list"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Reference, guest, phone, unit or screen…"
          maxLength={80}
          className="h-3xl min-w-0 flex-1 bg-transparent text-body-md text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        />
        {phase === 'searching' ? (
          <span className="text-caption text-muted-foreground" aria-live="polite">
            Searching…
          </span>
        ) : null}
      </div>

      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label="Results"
        className="max-h-[min(440px,60dvh)] overflow-y-auto"
      >
        {shown && shown.groups.length > 0 ? (
          shown.groups.map((group) => (
            <div key={group.id} role="group" aria-label={group.label} className="py-xs">
              <p className="px-lg pt-sm pb-xs micro-label text-muted-foreground">{group.label}</p>
              {group.hits.map((hit) => {
                const index = hits.indexOf(hit)

                return (
                  <ResultRow
                    key={hit.id}
                    id={`${listId}-${hit.id}`}
                    hit={hit}
                    index={index}
                    isActive={hit === active}
                    onHover={() => setActiveIndex(index)}
                    onChoose={() => open(hit)}
                  />
                )
              })}
            </div>
          ))
        ) : (
          <p className="px-lg py-lg text-body-sm text-muted-foreground" aria-live="polite">
            {emptyMessage(trimmed, phase, shown)}
          </p>
        )}
      </div>
    </>
  )
}

function emptyMessage(term: string, phase: Phase, shown: Results | null): string {
  if (term.length === 0) {
    return 'Find a booking, payment, deposit or unit by its reference, the guest’s name or phone, or the unit — or type a screen’s name to go there.'
  }

  if (phase === 'failed') {
    return 'Search is not available right now. Try again in a moment.'
  }

  if (shown === null || phase === 'searching') {
    return 'Searching…'
  }

  // The term the answer was for, which trails what is typed by a pause.
  return `Nothing matches “${shown.term}”.`
}

interface ResultRowProps {
  id: string
  hit: SearchHit
  index: number
  isActive: boolean
  onHover: () => void
  onChoose: () => void
}

function ResultRow({ id, hit, index, isActive, onHover, onChoose }: ResultRowProps) {
  return (
    <div
      id={id}
      role="option"
      aria-selected={isActive}
      data-index={index}
      onMouseMove={onHover}
      onClick={onChoose}
      className={cn(
        'mx-xs flex cursor-pointer items-baseline gap-md rounded-md px-md py-sm',
        isActive && 'bg-muted',
      )}
    >
      {hit.reference ? (
        <span className="w-20 shrink-0 truncate font-mono text-body-sm text-foreground">
          {hit.reference}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-sm-strong text-foreground">{hit.title}</span>
        <span className="block truncate text-caption text-muted-foreground">{hit.detail}</span>
      </span>
    </div>
  )
}
