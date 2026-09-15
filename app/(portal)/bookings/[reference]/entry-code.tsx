import type { Route } from 'next'
import Image from 'next/image'
import { Download } from 'lucide-react'

import { SectionCard } from '@/components/portal/section-card'
import { Button } from '@/components/ui/button'
import { entryCodeOrigin, getEntryCodeUrl } from '@/lib/db/entry-qr'
import type { BookingStatus } from '@/lib/domain/booking-state'
import { entryCodeShownFor } from '@/lib/domain/entry-qr'
import { entryQrDataUrl } from '@/lib/qr/entry-qr'

import { ReplaceEntryCodeButton } from './replace-entry-code-button'

/**
 * The booking's entry QR code, for the desk to forward (capability A8's QR
 * half, D3; prd.md §12).
 *
 * The confirmation email carries it for a guest who gave an address; this is
 * how everybody else gets it — a walk-in, a booking taken over the phone — by
 * the desk downloading the image and sending it in the WhatsApp conversation it
 * already has with them (prd.md assumption A6).
 *
 * design.md's QR block inside the section card: the code at 200 px on its own
 * white quiet zone, the reference in `display-sm` mono beneath, one guidance
 * line. Drawn from a `data:` URL made on the server, so showing it costs no
 * second request and puts the token in no URL a browser would log.
 */

const TITLE = 'Entry QR code'
const HEADING_ID = 'entry-code-heading'

export async function EntryCode({
  booking,
  mayReplace,
  className,
}: {
  booking: { id: string; reference: string; status: BookingStatus }
  mayReplace: boolean
  className?: string
}) {
  if (!entryCodeShownFor(booking.status)) {
    // Before confirmation there is nothing to forward yet, and saying so is
    // what stops the desk hunting for it. After the stay there is nothing to
    // say at all.
    return booking.status === 'draft' ||
      booking.status === 'held' ||
      booking.status === 'awaiting_payment_verification' ? (
      <SectionCard id={HEADING_ID} title={TITLE} className={className}>
        <p className="text-body-sm text-muted-foreground">
          The code is issued when the booking is confirmed.
        </p>
      </SectionCard>
    ) : null
  }

  const url = await getEntryCodeUrl(booking)

  if (url === null) {
    // A confirmed booking always has a token, so the only way here is a
    // deployment with no site address to point the code at. Said, so nobody
    // mistakes a configuration gap for a booking without a code.
    return entryCodeOrigin() === null ? (
      <SectionCard id={HEADING_ID} title={TITLE} className={className}>
        <p className="text-body-sm text-muted-foreground">
          The code cannot be shown until this system&rsquo;s site address (SITE_ORIGIN) is set.
          Ask whoever maintains it.
        </p>
      </SectionCard>
    ) : null
  }

  const image = await entryQrDataUrl(url)

  return (
    <SectionCard
      id={HEADING_ID}
      title={TITLE}
      hint="The guard scans this at the gate to open the booking. It lets nobody in by itself — only a signed-in guard can check a guest in."
      actions={
        mayReplace ? (
          <ReplaceEntryCodeButton bookingId={booking.id} reference={booking.reference} />
        ) : undefined
      }
      className={className}
    >
      <div className="flex flex-col items-start gap-lg sm:flex-row sm:items-center">
        <Image
          src={image}
          alt={`Entry QR code for booking ${booking.reference}`}
          width={200}
          height={200}
          unoptimized
          className="size-[200px] shrink-0 rounded-md border border-border bg-white"
        />
        <div className="min-w-0">
          <p className="font-mono text-display-sm text-foreground">{booking.reference}</p>
          <p className="mt-xs max-w-[44ch] text-body-sm text-muted-foreground">
            The guest shows this at the gate. Send it to them on WhatsApp if they have not had it
            by email.
          </p>
          {/* An anchor wearing a button: the response is a file with a name on
              it, and has to survive a middle-click (design.md §Components). */}
          <Button asChild variant="tertiary" className="mt-md">
            <a href={`/bookings/${encodeURIComponent(booking.reference)}/entry-qr` as Route}>
              <Download aria-hidden />
              Download image
            </a>
          </Button>
        </div>
      </div>
    </SectionCard>
  )
}
