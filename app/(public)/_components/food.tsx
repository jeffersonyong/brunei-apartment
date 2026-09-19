import { Phone } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { foodNoticeParagraphs, telHref } from '@/lib/domain/food-notice'
import { cn } from '@/lib/utils'

/**
 * What guests are told about food (Jeff, 19 September 2026), as the food page
 * and a confirmed booking both show it: the notice a paragraph a line, then
 * the provider's number as something a phone can dial.
 *
 * The words are staff's (Website settings → Food), so they are rendered as
 * text and never as markup.
 */
export function FoodNoticeText({
  notice,
  className,
}: {
  notice: { body: string; phone: string }
  className?: string
}) {
  return (
    <div className={cn('grid gap-sm', className)}>
      {foodNoticeParagraphs(notice.body).map((paragraph, index) => (
        <p key={index} className="text-body-md text-foreground">
          {paragraph}
        </p>
      ))}
    </div>
  )
}

/** A hairline button, not a lagoon fill: calling the provider is not booking. */
export function CallFoodProviderButton({
  phone,
  className,
}: {
  phone: string
  className?: string
}) {
  return (
    <Button asChild variant="tertiary" className={className}>
      <a href={telHref(phone)}>
        <Phone aria-hidden />
        Call {phone}
      </a>
    </Button>
  )
}
