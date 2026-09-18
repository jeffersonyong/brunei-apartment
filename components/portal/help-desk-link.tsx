import { Sparkle } from 'lucide-react'

/**
 * The staff help desk: a ChatGPT project whose only source is
 * docs/operations-guide.md, answering "how do I…" in the reader's own words.
 *
 * A constant rather than an environment variable: it is not a secret, and it
 * changes only if the project is recreated, which is a one-line PR. The project
 * is open to anyone holding the link, so the link lives only on staff screens —
 * never on the public site, where a guest would find the guide.
 */
export const HELP_DESK_URL =
  'https://chatgpt.com/g/g-p-6aadaffd9e8481918ff3cac98c5d55e0-brunei-apartment-palm-villa/project'

/**
 * "Ask anything", left of the search field: the two ways of finding something
 * sit side by side. Ghost rather than bordered, so the search field stays the
 * one object in the header and this reads as its quieter neighbour. Below
 * `md` it folds to the glyph, as the search field folds to its icon.
 *
 * A new tab, so the screen being asked about stays where it was.
 */
export function HelpDeskLink() {
  return (
    <a
      href={HELP_DESK_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-control min-w-control items-center justify-center gap-xs rounded-md px-sm text-body-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-panel"
    >
      <Sparkle aria-hidden className="size-4 shrink-0" />
      <span className="sr-only md:not-sr-only">Ask anything</span>
      <span className="sr-only">(opens the help desk in a new tab)</span>
    </a>
  )
}
