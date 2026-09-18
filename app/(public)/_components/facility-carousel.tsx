'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * The day-pass facility cards, one row wide from a tablet up (Jeff, 18
 * September 2026).
 *
 * The cards wrapped as a grid, and a pass that admits seven things left a row
 * of one under two rows of three — a list that looked unfinished. So from `md`
 * the cards are one row that scrolls sideways, two to a view and three from
 * `lg`, with a pair of small arrows level with the section's lead line that
 * page it by a view's width. A phone keeps the stack it had: one card to a
 * width already reads as a list, and a thumb scrolls it without help.
 *
 * Whether the arrows show is decided by the count, not by measuring, so the
 * server renders them in place and nothing moves when the page hydrates: more
 * cards than a view holds shows them. Which one is live follows the scroll, so
 * the ends say they are ends.
 */

interface FacilityCarouselProps {
  /** The section's lead line, which the arrows sit level with. */
  lead: React.ReactNode
  /** How many cards — decides whether there is anything to page to. */
  count: number
  /** The `<li>` cards. */
  children: React.ReactNode
}

const LIST_ID = 'day-pass-facilities'

export function FacilityCarousel({ lead, count, children }: FacilityCarouselProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ atStart: true, atEnd: false, isScrollable: false })

  const measure = useCallback(() => {
    const list = listRef.current

    if (!list) {
      return
    }

    // A pixel of slack: a fractional scroll position never quite reaches the end.
    setEdges({
      atStart: list.scrollLeft <= 1,
      atEnd: list.scrollLeft + list.clientWidth >= list.scrollWidth - 1,
      isScrollable: list.scrollWidth > list.clientWidth + 1,
    })
  }, [])

  useEffect(() => {
    const list = listRef.current

    if (!list) {
      return
    }

    measure()
    list.addEventListener('scroll', measure, { passive: true })
    const observer = new ResizeObserver(measure)
    observer.observe(list)

    return () => {
      list.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [measure])

  function page(direction: -1 | 1) {
    const list = listRef.current

    if (!list) {
      return
    }

    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollBy({ left: direction * list.clientWidth, behavior: isReduced ? 'auto' : 'smooth' })
  }

  const arrows = count > 2 && (
    <div
      className={cn('hidden shrink-0 gap-xs md:flex', count <= 3 && 'lg:hidden')}
      role="group"
      aria-label="Scroll the facilities"
    >
      <Button
        variant="tertiary"
        size="icon"
        aria-controls={LIST_ID}
        aria-label="Previous facilities"
        disabled={edges.atStart}
        onClick={() => page(-1)}
      >
        <ChevronLeft aria-hidden />
      </Button>
      <Button
        variant="tertiary"
        size="icon"
        aria-controls={LIST_ID}
        aria-label="More facilities"
        disabled={edges.atEnd}
        onClick={() => page(1)}
      >
        <ChevronRight aria-hidden />
      </Button>
    </div>
  )

  return (
    <>
      <div className="mt-md flex items-end justify-between gap-lg">
        {lead}
        {arrows}
      </div>

      <ul
        ref={listRef}
        id={LIST_ID}
        // Focusable only while it scrolls, so a keyboard can scroll it too. On a
        // phone it is a plain stack, and a tab stop there would lead nowhere.
        tabIndex={edges.isScrollable ? 0 : undefined}
        aria-label="What the day pass admits"
        className={cn(
          'mt-2xl grid gap-lg rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          // The top pixel is room for a card's hover lift, which the scroll
          // container would otherwise clip.
          'md:flex md:snap-x md:snap-mandatory md:overflow-x-auto md:pt-px',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          // Each card is a view's share of the row, less its share of the gaps.
          'md:[&>li]:w-[calc((100%-var(--spacing-lg))/2)] md:[&>li]:shrink-0 md:[&>li]:snap-start',
          'lg:[&>li]:w-[calc((100%-2*var(--spacing-lg))/3)]',
        )}
      >
        {children}
      </ul>
    </>
  )
}
