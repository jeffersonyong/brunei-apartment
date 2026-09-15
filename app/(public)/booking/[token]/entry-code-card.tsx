import type { Route } from 'next'
import Image from 'next/image'
import { Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getEntryCodeUrl } from '@/lib/db/entry-qr'
import type { BookingStatus } from '@/lib/domain/booking-state'
import { entryQrDataUrl } from '@/lib/qr/entry-qr'

/**
 * The guest's entry QR code, on their own booking page (Jeff, 15 September
 * 2026).
 *
 * The email carries the same code. This is here for the guest who booked
 * without an address — the field is optional — and for the one who cannot find
 * the email at the barrier.
 *
 * design.md's QR block: a white card, the code centred at 240 px with its own
 * quiet zone, the reference in `display-sm` mono beneath, guidance in
 * `body-sm`. Saving is a tertiary anchor to a download: the teal fill is the
 * page's one action and nothing here is asking the guest to act.
 */
export async function EntryCodeCard({
  token,
  booking,
  className,
}: {
  token: string
  booking: { id: string; reference: string; status: BookingStatus }
  className?: string
}) {
  const url = await getEntryCodeUrl(booking)

  if (url === null) {
    return null
  }

  const image = await entryQrDataUrl(url)

  return (
    <Card className={className}>
      <div className="flex flex-col items-center text-center">
        <p className="micro-label text-muted-foreground">Your entry code</p>
        <Image
          src={image}
          alt={`Entry QR code for booking ${booking.reference}`}
          width={240}
          height={240}
          unoptimized
          className="mt-md size-[240px] bg-white"
        />
        <p className="mt-sm font-mono text-display-sm text-foreground">{booking.reference}</p>
        <p className="mt-xs max-w-[40ch] text-body-sm text-muted-foreground">
          Show this at the gate. Save it to your phone, or send it to whoever is driving.
        </p>
        <Button asChild variant="tertiary" className="mt-md">
          <a href={`/booking/${token}/entry-qr` as Route}>
            <Download aria-hidden />
            Save the image
          </a>
        </Button>
      </div>
    </Card>
  )
}
