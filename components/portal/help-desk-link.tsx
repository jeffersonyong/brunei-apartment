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
 * The gradient the glyph's stroke points at. SVG strokes cannot take a CSS
 * gradient, so it is declared once as an SVG gradient whose stops read the same
 * `--ask-from` / `--ask-to` tokens as the label. The link renders once, in the
 * portal header, so a fixed id is safe.
 */
const GLYPH_GRADIENT_ID = 'ask-anything-gradient'

/**
 * "Ask anything", left of the search field: the two ways of finding something
 * sit side by side. Ghost at rest, so the search field stays the one object in
 * the header; below `md` it folds to the glyph, as the search field folds to
 * its icon.
 *
 * On hover or focus it is the one coloured thing on the operations surfaces
 * (design.md §Components — Ask anything): label and glyph take the static
 * violet-blue `ask-gradient`. The gradient is applied only then, never
 * carried invisibly at rest: text clipped to a background is drawn with
 * different smoothing and reads heavier than its neighbours, so the resting
 * label must be plain text.
 *
 * A new tab, so the screen being asked about stays where it was.
 */
export function HelpDeskLink() {
  return (
    <a
      href={HELP_DESK_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex h-control min-w-control items-center justify-center gap-xs rounded-md px-sm text-body-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-panel"
    >
      <svg aria-hidden focusable="false" className="absolute size-0">
        <defs>
          <linearGradient id={GLYPH_GRADIENT_ID} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--ask-from)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--ask-to)' }} />
          </linearGradient>
        </defs>
      </svg>
      <Sparkle
        aria-hidden
        className="size-4 shrink-0 group-hover:[stroke:url(#ask-anything-gradient)_var(--ask-from)] group-focus-visible:[stroke:url(#ask-anything-gradient)_var(--ask-from)]"
      />
      <span className="sr-only group-hover:bg-[image:var(--ask-gradient)] group-hover:bg-clip-text group-hover:text-transparent group-focus-visible:bg-[image:var(--ask-gradient)] group-focus-visible:bg-clip-text group-focus-visible:text-transparent md:not-sr-only">
        Ask anything
      </span>
      <span className="sr-only">(opens the help desk in a new tab)</span>
    </a>
  )
}
