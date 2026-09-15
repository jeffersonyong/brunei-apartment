import { NextResponse } from 'next/server'

import { hasPermission } from '@/lib/auth/permissions'
import { getActor } from '@/lib/auth/require-permission'
import { getBookingByReference } from '@/lib/db/bookings'
import { getEntryCodeUrl } from '@/lib/db/entry-qr'
import { entryQrFilename } from '@/lib/domain/entry-qr'
import { entryQrPng } from '@/lib/qr/entry-qr'

/**
 * The entry QR code as a file, for the desk to forward over WhatsApp
 * (prd.md §12; architecture.md §7).
 *
 * A route handler because the answer is a download with a name on it, which a
 * server action cannot give. Under `/bookings`, so the proxy has already
 * refused anybody signed out; `booking.view` is checked again here because a
 * URL is guessable in a way a button is not. Nothing is written, so unlike the
 * document route a prefetch or a HEAD costs nothing.
 */

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  context: { params: Promise<{ reference: string }> },
): Promise<NextResponse> {
  const actor = await getActor()

  if (!actor) {
    return deny(401, 'Sign in to download this code.')
  }

  if (!hasPermission(actor.permissions, 'booking.view')) {
    return deny(403, 'You do not have access to this booking.')
  }

  const { reference } = await context.params
  const booking = await getBookingByReference(decodeURIComponent(reference))
  const url = booking ? await getEntryCodeUrl(booking) : null

  if (!booking || url === null) {
    return deny(404, 'This booking has no entry code to download.')
  }

  return pngResponse(await entryQrPng(url), entryQrFilename(booking.reference))
}

function pngResponse(png: Buffer, filename: string): NextResponse {
  return new NextResponse(new Uint8Array(png), {
    headers: {
      'content-type': 'image/png',
      'content-disposition': `attachment; filename="${filename}"`,
      // The image is a credential's picture: kept by nobody in between.
      'cache-control': 'private, no-store',
    },
  })
}

function deny(status: number, message: string): NextResponse {
  return new NextResponse(message, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  })
}
