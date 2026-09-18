import { MessageCircleQuestion } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

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
 * An icon link beside the notifications bell, built like it: muted glyph, the
 * `muted` chip on hover, the control size. It opens a new tab so the screen
 * being asked about stays where it was.
 */
export function HelpDeskLink() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={HELP_DESK_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ask the help desk (opens in a new tab)"
          className="inline-flex size-control items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-panel"
        >
          <MessageCircleQuestion aria-hidden className="size-4" />
        </a>
      </TooltipTrigger>
      <TooltipContent>Ask the help desk how to do anything here</TooltipContent>
    </Tooltip>
  )
}
