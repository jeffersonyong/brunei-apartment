'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

import { RefreshLine } from '@/components/field/refresh-line'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { GateBooking, GateList } from '@/lib/db/gate'
import { matchesGateSearch } from '@/lib/domain/gate'

import { GateCard, type GateMoves } from './gate-card'

/**
 * Today's list, filtered as the guard types.
 *
 * The filter runs over rows already on the phone, so it works on no signal at
 * all once the page has loaded. The box is also a GET form: pressing search on
 * the keyboard asks the server for every open booking matching the term,
 * which is how the car whose booking starts tomorrow is found.
 *
 * Four sections, because the guard's questions differ: a stay arriving for its
 * keys, a guest leaving whose keys come back (N54), a day visitor to admit or
 * turn away, and a guest's car coming back.
 */

interface ArrivalsListProps {
  list: GateList
  /** The term the server searched, or empty when it did not. */
  query: string
  /** What that search found. Null when nothing was searched. */
  found: readonly GateBooking[] | null
  /** "14:02" — when this list was read. */
  loadedAt: string
  /** Which of the gate's moves the reader holds. */
  moves: GateMoves
}

const SEARCH_FORM_ID = 'gate-search'

export function ArrivalsList({ list, query, found, loadedAt, moves }: ArrivalsListProps) {
  const [term, setTerm] = useState(query)

  const typed = term.trim()
  const matching = (rows: readonly GateBooking[]) =>
    rows.filter((row) => matchesGateSearch(term, row))

  const expected = matching(list.expected)
  const leaving = matching(list.leaving)
  const dayPasses = matching(list.dayPasses)
  const inResidence = matching(list.inResidence)
  const onTodaysList = expected.length + leaving.length + dayPasses.length + inResidence.length
  // A server search belongs to the term it was run for. Once the guard types
  // something else, its results are about a different car.
  const searchIsCurrent = found !== null && typed === query

  return (
    <div className="mt-lg">
      <form
        id={SEARCH_FORM_ID}
        role="search"
        action="/field/arrivals"
        method="get"
        className="sticky top-0 z-10 -mx-lg bg-background px-lg py-sm"
      >
        <label htmlFor="gate-search-term" className="sr-only">
          Plate, name or booking reference
        </label>
        <Input
          id="gate-search-term"
          name="q"
          type="search"
          inputSize="touch"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Plate, name or reference"
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
        />
      </form>

      <RefreshLine loadedAt={loadedAt} />

      {typed.length > 0 && onTodaysList === 0 ? (
        <p className="mt-lg text-body-md text-foreground">
          Nobody on today&rsquo;s list matches &ldquo;{typed}&rdquo;.
        </p>
      ) : null}

      <GateSection
        id="gate-expected"
        title="Arriving"
        rows={expected}
        moves={moves}
        empty={typed.length > 0 ? null : 'Nobody else is due to arrive today.'}
      />

      {list.leaving.length > 0 ? (
        <GateSection
          id="gate-leaving"
          title="Leaving today"
          rows={leaving}
          moves={moves}
          empty={null}
        />
      ) : null}

      {list.dayPasses.length > 0 ? (
        <GateSection
          id="gate-day-passes"
          title="Day passes"
          rows={dayPasses}
          moves={moves}
          empty={null}
        />
      ) : null}

      {list.inResidence.length > 0 ? (
        <GateSection
          id="gate-in-residence"
          title="Already in"
          rows={inResidence}
          moves={moves}
          empty={null}
        />
      ) : null}

      {typed.length > 0 && !searchIsCurrent ? (
        <div className="mt-2xl rounded-lg border border-border bg-card p-card">
          <p className="text-body-md text-foreground">Not on today&rsquo;s list?</p>
          <p className="mt-xxs text-body-sm text-muted-foreground">
            Search every open booking, whatever day it starts.
          </p>
          <Button
            type="submit"
            form={SEARCH_FORM_ID}
            variant="tertiary"
            size="touch"
            className="mt-md w-full"
          >
            <Search aria-hidden />
            Search all bookings for &ldquo;{typed}&rdquo;
          </Button>
        </div>
      ) : null}

      {searchIsCurrent ? (
        <GateSection
          id="gate-search-results"
          title={`All bookings matching “${query}”`}
          rows={found}
          moves={moves}
          empty="No open booking matches. Call the office."
        />
      ) : null}
    </div>
  )
}

interface GateSectionProps {
  id: string
  title: string
  rows: readonly GateBooking[]
  moves: GateMoves
  /** What to say when the section is empty, or null to say nothing. */
  empty: string | null
}

function GateSection({ id, title, rows, moves, empty }: GateSectionProps) {
  if (rows.length === 0 && empty === null) {
    return null
  }

  return (
    <section aria-labelledby={id} className="mt-2xl">
      {/* A heading above the cards it names, on the ground — so `display-xs`,
          not a micro label (design.md §Typography, inside or outside). */}
      <h2 id={id} className="text-display-xs text-foreground">
        {title} <span className="text-muted-foreground tabular-nums">{rows.length}</span>
      </h2>

      {rows.length === 0 ? (
        <p className="mt-sm text-body-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-md grid gap-md">
          {rows.map((row) => (
            <li key={row.id}>
              <GateCard booking={row} moves={moves} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
