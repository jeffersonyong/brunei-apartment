import type { PrivacyPolicyBlock, PrivacyPolicyRuns } from '@/lib/domain/privacy-policy'
import { cn } from '@/lib/utils'

/**
 * The privacy policy as a guest reads it (capability F10), on `/privacy`.
 *
 * Geist only. The page's own title is the customer surface's one Fraunces
 * moment; the section headings inside the document are content, set at
 * `display-xs` like the FAQ's topic headings. The portal's rich text editor
 * draws the same constructions with the same tokens (`policy-rich-text.tsx`),
 * so what staff write looks like what a guest reads.
 *
 * Every block is text in an element — `parsePrivacyPolicy()` produces no
 * markup, and nothing here renders any.
 */
export function PrivacyPolicyDocument({
  blocks,
  className,
}: {
  blocks: readonly PrivacyPolicyBlock[]
  className?: string
}) {
  return (
    <div className={cn('max-w-[64ch]', className)}>
      {blocks.map((block, index) => {
        switch (block.kind) {
          case 'heading':
            return (
              <h2 key={index} className="mt-2xl text-display-xs text-foreground first:mt-0">
                <Runs runs={block.runs} />
              </h2>
            )
          case 'paragraph':
            return (
              <p key={index} className="mt-sm text-body-md text-copy first:mt-0">
                <Runs runs={block.runs} />
              </p>
            )
          case 'list': {
            const List = block.ordered ? 'ol' : 'ul'

            return (
              <List
                key={index}
                className={cn(
                  'mt-sm grid gap-xs pl-lg text-body-md text-copy marker:text-muted-foreground first:mt-0',
                  block.ordered ? 'list-decimal marker:tabular-nums' : 'list-disc',
                )}
              >
                {block.items.map((runs, itemIndex) => (
                  <li key={itemIndex}>
                    <Runs runs={runs} />
                  </li>
                ))}
              </List>
            )
          }
        }
      })}
    </div>
  )
}

function Runs({ runs }: { runs: PrivacyPolicyRuns }) {
  return runs.map((run, index) =>
    run.bold ? (
      <strong key={index} className="font-semibold text-foreground">
        {run.text}
      </strong>
    ) : (
      <span key={index}>{run.text}</span>
    ),
  )
}
