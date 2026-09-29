'use client'

import { useEffect, useRef, useState } from 'react'

import { CalendarHeader, isMonthOutOfBounds, type DayBounds } from '@/components/ui/calendar-grid'
import type { StayDate } from '@/lib/domain/dates'
import { cn } from '@/lib/utils'

import {
  formatMonthShort,
  formatYearPage,
  isYearOutOfBounds,
  isYearPageOutOfBounds,
  monthsOfYear,
  YEARS_PER_PAGE,
  yearOf,
  yearPageStartFor,
  yearsOnPage,
} from './calendar-year'
import { formatCalendarMonth, monthOf, type CalendarMonth } from './calendar-month'

/**
 * The year jump (design.md §Components — Single date entry): twelve years,
 * then the twelve months of the year picked, then back to the day grid on the
 * month picked. Opened and closed by the footer's *Choose a year* / *Back to
 * days*, which the picker around it owns.
 *
 * **It lies over the day grid rather than replacing it.** The grid stays laid
 * out underneath, invisible, so the panel keeps its exact size through all
 * three views — a popover that shrank to fit twelve years would move its own
 * footer out from under the pointer that just pressed it.
 *
 * **A jump selects nothing.** It moves the view, and the day is still tapped,
 * so nothing here wears the ink fill that means *chosen*. The year and month
 * that were in view carry the `muted` "where am I" chip, and today's carry the
 * day grid's dot.
 *
 * The same header and the same arrows as the day grid: in the year view they
 * page twelve years, in the month view they step one year, so a wrongly picked
 * year is one press away rather than a trip back to the page of years.
 */

interface CalendarJumpProps {
  /** The month the day grid was on — what both views mark as "where am I". */
  month: CalendarMonth
  today: StayDate
  bounds: DayBounds
  /** The month picked in the second view. The picker lands the grid on it. */
  onPick: (month: CalendarMonth) => void
  className?: string
}

type Stage = { kind: 'years'; pageStart: number } | { kind: 'months'; year: number }

interface JumpCell {
  key: string
  label: string
  accessibleName: string
  isInView: boolean
  isToday: boolean
  isDisabled: boolean
  pick: () => void
}

/** Three across, so a row is three cells and a column step is three. */
const COLUMNS = 3

export function CalendarJump({ month, today, bounds, onPick, className }: CalendarJumpProps) {
  const [stage, setStage] = useState<Stage>(() => ({
    kind: 'years',
    pageStart: yearPageStartFor(yearOf(month)),
  }))
  /** The keyboard's cell, or `null` to rest on the stage's default. */
  const [focusIndex, setFocusIndex] = useState<number | null>(null)
  // Focus enters the grid when the jump opens and again when it moves on to
  // the months — the two moments the pressed control disappears. Paging with
  // an arrow leaves focus on the arrow, which can be pressed again.
  const shouldFocus = useRef(true)
  const gridRef = useRef<HTMLDivElement>(null)

  const cells = stage.kind === 'years' ? yearCells(stage.pageStart) : monthCells(stage.year)
  const tabIndex = rovingIndexOf(cells, focusIndex)

  useEffect(() => {
    if (!shouldFocus.current) {
      return
    }

    shouldFocus.current = false
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-index="${tabIndex}"]`)?.focus()
  })

  function yearCells(pageStart: number): JumpCell[] {
    return yearsOnPage(pageStart).map((year) => ({
      key: String(year),
      label: String(year),
      accessibleName: String(year),
      isInView: year === yearOf(month),
      isToday: year === yearOf(monthOf(today)),
      isDisabled: isYearOutOfBounds(year, bounds),
      pick: () => {
        shouldFocus.current = true
        setFocusIndex(null)
        setStage({ kind: 'months', year })
      },
    }))
  }

  function monthCells(year: number): JumpCell[] {
    return monthsOfYear(year).map((candidate) => ({
      key: candidate,
      label: formatMonthShort(candidate),
      accessibleName: formatCalendarMonth(candidate),
      isInView: candidate === month,
      isToday: candidate === monthOf(today),
      isDisabled: isMonthOutOfBounds(candidate, bounds),
      pick: () => onPick(candidate),
    }))
  }

  function step(delta: 1 | -1) {
    setFocusIndex(null)
    setStage(
      stage.kind === 'years'
        ? { kind: 'years', pageStart: stage.pageStart + delta * YEARS_PER_PAGE }
        : { kind: 'months', year: stage.year + delta },
    )
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const steps: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -COLUMNS,
      ArrowDown: COLUMNS,
    }

    const delta = steps[event.key]

    if (delta === undefined) {
      return
    }

    event.preventDefault()

    // Skip over what cannot be chosen, and stop at the edge of the page
    // rather than wrapping — the arrows in the header are how a page turns.
    let next = tabIndex + delta

    while (next >= 0 && next < cells.length && cells[next]?.isDisabled) {
      next += delta
    }

    if (next >= 0 && next < cells.length) {
      shouldFocus.current = true
      setFocusIndex(next)
    }
  }

  const header =
    stage.kind === 'years'
      ? {
          label: formatYearPage(stage.pageStart),
          previousLabel: 'Earlier years',
          nextLabel: 'Later years',
          disablePrevious: isYearPageOutOfBounds(stage.pageStart - YEARS_PER_PAGE, bounds),
          disableNext: isYearPageOutOfBounds(stage.pageStart + YEARS_PER_PAGE, bounds),
        }
      : {
          label: String(stage.year),
          previousLabel: 'Previous year',
          nextLabel: 'Next year',
          disablePrevious: isYearOutOfBounds(stage.year - 1, bounds),
          disableNext: isYearOutOfBounds(stage.year + 1, bounds),
        }

  return (
    <div className={cn('flex flex-col', className)}>
      <CalendarHeader
        {...header}
        showPrevious
        showNext
        onPrevious={() => step(-1)}
        onNext={() => step(1)}
      />
      <div
        ref={gridRef}
        role="group"
        aria-label={stage.kind === 'years' ? 'Choose a year' : `Choose a month in ${stage.year}`}
        onKeyDown={handleKeyDown}
        className="mt-xs grid flex-1 grid-cols-3 grid-rows-4 gap-xs"
      >
        {cells.map((cell, index) => (
          <button
            key={cell.key}
            type="button"
            data-index={index}
            disabled={cell.isDisabled}
            tabIndex={index === tabIndex ? 0 : -1}
            aria-label={cell.accessibleName}
            aria-current={cell.isToday ? 'date' : undefined}
            onClick={cell.pick}
            className={cn(
              'flex items-center justify-center rounded-md text-body-sm text-foreground transition-colors outline-none',
              'hover:bg-muted',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-popover',
              (cell.isInView || cell.isToday) && 'font-medium',
              cell.isInView && 'bg-muted',
              // The day grid's treatment for what the window does not offer:
              // drawn, so the run of years stays unbroken, and not offered.
              'disabled:pointer-events-none disabled:bg-transparent disabled:font-normal disabled:text-muted-foreground/45',
            )}
          >
            {/* The dot hangs from the label rather than the cell, which is
                taller than a day's: pinned to the cell's foot it would sit a
                long way below the word it marks. */}
            <span className="relative">
              {cell.label}
              {cell.isToday ? (
                <span
                  aria-hidden
                  className="absolute top-full left-1/2 mt-[2px] size-[3px] -translate-x-1/2 rounded-full bg-current opacity-70"
                />
              ) : null}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * The one cell in the tab order: the keyboard's, while it is choosable;
 * otherwise the one in view; otherwise the first that can be chosen.
 */
function rovingIndexOf(cells: readonly JumpCell[], focusIndex: number | null): number {
  if (focusIndex !== null && cells[focusIndex] && !cells[focusIndex].isDisabled) {
    return focusIndex
  }

  const inView = cells.findIndex((cell) => cell.isInView && !cell.isDisabled)

  if (inView !== -1) {
    return inView
  }

  return Math.max(
    cells.findIndex((cell) => !cell.isDisabled),
    0,
  )
}
