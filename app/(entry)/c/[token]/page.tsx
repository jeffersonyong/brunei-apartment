import type { Metadata, Route } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { GateCard } from '@/app/(field)/field/arrivals/gate-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { mayWork } from '@/lib/auth/field-jobs'
import { hasPermission } from '@/lib/auth/permissions'
import { getActor } from '@/lib/auth/require-permission'
import { getBookingById, type Booking } from '@/lib/db/bookings'
import { findBookingIdByEntryToken } from '@/lib/db/entry-qr'
import { getGateBooking } from '@/lib/db/gate'
import { formatStayDate, formatStayRange, todayInBrunei } from '@/lib/domain/dates'
import { entrySummarySentence, maskGuestName } from '@/lib/domain/entry-qr'

export const metadata: Metadata = {
  title: 'Entry code',
  // One person's booking, reached by a credential: never indexed.
  robots: { index: false, follow: false },
}

/** Read live, per session: the same URL shows a guard the gate and a stranger a summary. */
export const dynamic = 'force-dynamic'

/**
 * Where a scanned entry QR code lands (capability D3, prd.md §12 requirements
 * 1–4, architecture.md §7).
 *
 * **The code grants nothing; the session decides.** The token is found first,
 * shape-checked before any query, and a malformed code and an unknown one are
 * the same 404. Then:
 *
 * - **A reader who works the gate** gets the gate's own card for this booking
 *   — the same verdict, the same moves and the same cash as on
 *   `/field/arrivals`, through the same server actions, which re-read the
 *   booking and decide again before they write. Scanning replaces typing the
 *   plate; it changes nothing about what is allowed.
 * - **Other staff** get the summary, and a link into the portal when they may
 *   view bookings.
 * - **Anybody else** — the guest checking their own code, or whoever found a
 *   screenshot — gets a masked summary: the first name and an initial, the
 *   reference, the dates and where the booking stands. No plate, unit, phone
 *   or money. Signing in is offered quietly, for the guard whose session ended.
 */
export default async function EntryCodePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  // Who is looking does not depend on which booking the code is for, so the
  // two are read together rather than one after the other.
  const [bookingId, actor] = await Promise.all([findBookingIdByEntryToken(token), getActor()])

  if (!bookingId) {
    notFound()
  }

  if (actor && mayWork(actor.permissions, 'arrivals')) {
    const today = todayInBrunei()
    const mayTakeCash = hasPermission(actor.permissions, 'payment.record_cash')
    const booking = await getGateBooking(bookingId, today, {
      withReadiness: true,
      withCash: mayTakeCash,
    })

    if (!booking) {
      notFound()
    }

    return (
      <>
        <h1 className="text-display-sm text-foreground">Gate</h1>
        <p className="mt-xxs text-body-sm text-muted-foreground">{formatStayDate(today)}</p>

        <div className="mt-lg">
          <GateCard
            booking={booking}
            moves={{
              mayCheckIn: hasPermission(actor.permissions, 'booking.check_in'),
              mayCheckOut: hasPermission(actor.permissions, 'booking.check_out'),
              mayAdmit: hasPermission(actor.permissions, 'day_pass.admit'),
              mayTakeCash,
            }}
          />
        </div>
      </>
    )
  }

  const booking = await getBookingById(bookingId)

  if (!booking) {
    notFound()
  }

  const portalHref =
    actor && hasPermission(actor.permissions, 'booking.view')
      ? (`/bookings/${encodeURIComponent(booking.reference)}` as Route)
      : null

  return (
    <>
      <h1 className="text-display-sm text-foreground">Palm Villa entry code</h1>

      <Card className="mt-lg">
        <p className="text-body-md-strong text-foreground">{maskGuestName(booking.guestName)}</p>
        <p className="mt-xxs text-body-sm text-muted-foreground">
          <span className="font-mono tabular-nums">{booking.reference}</span> · {whenOf(booking)}
        </p>
        <p className="mt-md text-body-sm text-foreground">{entrySummarySentence(booking.status)}</p>
      </Card>

      {portalHref ? (
        <Button asChild size="touch" className="mt-lg w-full">
          <Link href={portalHref}>Open the booking</Link>
        </Button>
      ) : null}

      {actor === null ? (
        <p className="mt-lg text-body-sm text-muted-foreground">
          Palm Villa staff?{' '}
          <Link
            className="text-foreground underline hover:no-underline"
            href={`/login?next=${encodeURIComponent(`/c/${token}`)}` as Route}
          >
            Sign in
          </Link>{' '}
          to check this guest in.
        </p>
      ) : null}
    </>
  )
}

function whenOf(booking: Booking): string {
  if (booking.dayPass) {
    return `Day pass · ${formatStayDate(booking.dayPass.date)}`
  }

  if (booking.stay) {
    return formatStayRange(booking.stay.range.start, booking.stay.range.end)
  }

  return 'Dates not recorded'
}
