import { NextResponse } from 'next/server'

import { getEntryCodeUrl } from '@/lib/db/entry-qr'
import { getBookingByAccessToken } from '@/lib/db/public-bookings'
import { entryQrFilename } from '@/lib/domain/entry-qr'
import { entryQrPng } from '@/lib/qr/entry-qr'

/**
 * A guest saving their own entry QR code from their booking page (Jeff,
 * 15 September 2026).
 *
 * Behind the same credential as the page — the private link's token, shape-
 * checked before any query — and the same 404 for a malformed token, an
 * unknown one and a booking with no code, so a guesser learns nothing. What it
 * hands over is a picture of the entry code, which grants nothing without a
 * guard's session (architecture.md §7).
 */

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await context.params
  const booking = await getBookingByAccessToken(token)
  const url = booking ? await getEntryCodeUrl(booking) : null

  if (!booking || url === null) {
    return new NextResponse('Not found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
    })
  }

  return new NextResponse(new Uint8Array(await entryQrPng(url)), {
    headers: {
      'content-type': 'image/png',
      'content-disposition': `attachment; filename="${entryQrFilename(booking.reference)}"`,
      'cache-control': 'private, no-store',
      // The page's own rule, since this sits under it.
      'x-robots-tag': 'noindex',
    },
  })
}
