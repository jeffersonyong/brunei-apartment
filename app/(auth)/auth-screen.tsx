import { PortalBrand } from '@/components/portal/portal-brand'
import { Card } from '@/components/ui/card'

/**
 * The frame every sign-in screen shares: the sidebar's brand block above one
 * hairline card, a heading and a sentence in it, and a line of help under it
 * (design.md §Components — Cards). Signing in, asking for a reset link, opening
 * one and choosing the new password are four screens that should read as one
 * place, so the frame is drawn once.
 *
 * No Fraunces and no teal: these screens front the operations surfaces and take
 * their monochrome register (app/(auth)/layout.tsx).
 */
export function AuthScreen({
  title,
  description,
  footer,
  children,
}: {
  title: string
  description?: React.ReactNode
  /** The line under the card — where to go instead, or who to ask. */
  footer?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="w-full max-w-[360px]">
      <div className="mb-lg">
        <PortalBrand />
      </div>

      <Card>
        <h1 className="text-body-md-strong text-foreground">{title}</h1>
        {description ? (
          <p className="mt-xs text-body-sm text-muted-foreground">{description}</p>
        ) : null}
        {children ? <div className="mt-lg">{children}</div> : null}
      </Card>

      {footer ? <p className="mt-lg text-body-sm text-muted-foreground">{footer}</p> : null}
    </div>
  )
}

/**
 * design.md's text action — ink words over a muted underline that darkens under
 * the pointer — for the links between these screens.
 */
export const TEXT_ACTION_CLASSES =
  'rounded-sm text-foreground underline decoration-muted-foreground underline-offset-2 transition-colors outline-none hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring'
