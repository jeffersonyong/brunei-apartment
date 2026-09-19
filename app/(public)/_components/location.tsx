import Image from 'next/image'
import { MapPin } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { contact } from '../_content/landing'

/** `public/location-map.webp`, the client's image re-encoded (3 MB PNG to 280 KB). */
const MAP_IMAGE = { src: '/location-map.webp', width: 1302, height: 1208 } as const

/**
 * Where Palm Villa is (Jeff, 19 September 2026): the address, the client's
 * aerial map with the building marked, and a link to their own Google Maps pin.
 *
 * Two places show it, the landing page's "Getting here" band and a confirmed
 * booking, so the pieces live here and each place composes them.
 *
 * The map's size is written down rather than read from a static import, which
 * would need Next's generated image types: the frame still reserves its height
 * before the picture arrives, so nothing below it shifts.
 */

/** The address, one line per row, as the client writes it. */
export function PropertyAddress({ className }: { className?: string }) {
  return (
    <address className={cn('text-body-md text-foreground not-italic', className)}>
      {contact.address.map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}
    </address>
  )
}

/**
 * The aerial map, which opens the pin as well. The picture is the thing people
 * tap, so tapping it goes where the button does.
 */
export function LocationMap({ sizes, className }: { sizes: string; className?: string }) {
  return (
    <a
      href={contact.mapsUrl}
      target="_blank"
      rel="noreferrer"
      className={cn(
        'block overflow-hidden rounded-lg border border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        className,
      )}
    >
      <Image
        src={MAP_IMAGE.src}
        width={MAP_IMAGE.width}
        height={MAP_IMAGE.height}
        alt="Aerial map with Palm Villa marked, near KB Sentral and the Rasau By-Pass"
        sizes={sizes}
        className="h-auto w-full"
      />
    </a>
  )
}

/** A hairline button, not a lagoon fill: it leaves the site rather than booking. */
export function OpenInMapsButton({ className }: { className?: string }) {
  return (
    <Button asChild variant="tertiary" className={className}>
      <a href={contact.mapsUrl} target="_blank" rel="noreferrer">
        <MapPin aria-hidden />
        Open in Google Maps
      </a>
    </Button>
  )
}
