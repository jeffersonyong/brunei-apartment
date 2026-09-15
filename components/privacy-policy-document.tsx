import type { PrivacyPolicyBlock } from '@/lib/domain/privacy-policy'
import { cn } from '@/lib/utils'

/**
 * The privacy policy as a guest reads it (capability F10) — on the public
 * page, and in the portal's preview, which is why it is one component: the
 * preview is only honest if it is the same markup.
 *
 * Geist only. The page's own title is the customer surface's one Fraunces
 * moment; the section headings inside the document are content, set at
 * `display-xs` like the FAQ's topic headings, and the portal may show them
 * because they carry no brand face and no brand hue.
 *
 * Every block is text in an element — `parsePrivacyPolicy()` produces no
 * markup, and nothing here renders any.
 */
export function PrivacyPolicyDocument({
  blocks,
  headingLevel = 'h2',
  className,
}: {
  blocks: readonly PrivacyPolicyBlock[]
  /** `h2` under the public page's title; `h3` inside a portal section. */
  headingLevel?: 'h2' | 'h3'
  className?: string
}) {
  const Heading = headingLevel

  return (
    <div className={cn('max-w-[64ch]', className)}>
      {blocks.map((block, index) => {
        switch (block.kind) {
          case 'heading':
            return (
              <Heading key={index} className="mt-2xl text-display-xs text-foreground first:mt-0">
                {block.text}
              </Heading>
            )
          case 'paragraph':
            return (
              <p key={index} className="mt-sm text-body-md text-copy first:mt-0">
                {block.text}
              </p>
            )
          case 'list':
            return (
              <ul
                key={index}
                className="mt-sm grid list-disc gap-xs pl-lg text-body-md text-copy marker:text-muted-foreground first:mt-0"
              >
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            )
        }
      })}
    </div>
  )
}
