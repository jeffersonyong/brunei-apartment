'use client'

/**
 * The quiet buttons in a date picker's footer — *Today*, *Clear*, and the year
 * jump's toggle — shared by the single-day field and the range filter so the
 * two footers cannot drift apart. Copy, not chrome: body-sm in the copy tone,
 * a hover surface and no outline, because the footer is the panel's margin and
 * the grid above it is the content.
 */

export function FooterButton({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-xs rounded-md px-sm py-xs text-body-sm text-copy transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-popover"
    >
      {children}
    </button>
  )
}

/**
 * The way into the year jump and back out of it (design.md §Components —
 * Single date entry). One button whose words say what the next press does,
 * rather than a switch whose state has to be read: *Choose a year* from the
 * days, *Back to days* from the years and months — which is also the way out
 * without choosing anything, since Escape closes the whole panel.
 */
export function YearJumpToggle({
  isJumping,
  onToggle,
}: {
  isJumping: boolean
  onToggle: () => void
}) {
  return (
    <FooterButton onClick={onToggle}>{isJumping ? 'Back to days' : 'Choose a year'}</FooterButton>
  )
}
