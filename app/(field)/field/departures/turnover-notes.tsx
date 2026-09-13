import { formatTimestamp } from '@/lib/domain/dates'
import type { TurnoverNote } from '@/lib/db/housekeeping'
import { cn } from '@/lib/utils'

/**
 * What the office has told the cleaner about this unit and this stay (D-7,
 * open-questions.md N18).
 *
 * Read-only on the phone. The unit's standing note ("the balcony door sticks")
 * first, because it is true of every stay; then the office's notes for
 * housekeeping on this one, newest first. A gray inset inside the card,
 * labelled in the micro voice (design.md §Cards) — and nothing at all when
 * there is nothing to say, rather than two empty headings.
 *
 * Only the housekeeping audience reaches here: an internal note is filtered
 * out in the query (lib/db/notes.ts), never by this component.
 */
export function TurnoverNotes({
  unitNote,
  housekeepingNotes,
  className,
}: {
  unitNote: string | null
  housekeepingNotes: readonly TurnoverNote[]
  className?: string
}) {
  if (unitNote === null && housekeepingNotes.length === 0) {
    return null
  }

  return (
    <dl className={cn('grid gap-md rounded-md bg-muted p-md', className)}>
      {unitNote !== null ? (
        <div className="min-w-0">
          <dt className="micro-label text-muted-foreground">About this unit</dt>
          <dd className="mt-xxs text-body-sm break-words whitespace-pre-line text-foreground">
            {unitNote}
          </dd>
        </div>
      ) : null}

      {housekeepingNotes.length > 0 ? (
        <div className="min-w-0">
          <dt className="micro-label text-muted-foreground">From the office</dt>
          <dd className="mt-xxs">
            <ul className="grid gap-sm">
              {housekeepingNotes.map((note) => (
                <li key={note.id}>
                  <p className="text-body-sm break-words whitespace-pre-line text-foreground">
                    {note.body}
                  </p>
                  <p className="mt-xxs text-caption text-muted-foreground tabular-nums">
                    {formatTimestamp(note.at)}
                  </p>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      ) : null}
    </dl>
  )
}
