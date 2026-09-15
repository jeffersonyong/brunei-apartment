import { toBuffer, toDataURL, type QRCodeRenderersOptions } from 'qrcode'

/**
 * The entry code as an image (architecture.md §7).
 *
 * Server-side only, and one set of options for every medium the code travels
 * in — the confirmation email's attachment, the portal's download and the
 * guest's booking page — so a code saved from any of them scans the same.
 *
 * - **480 px**, comfortably over §7's 400 px, so a screenshot forwarded over
 *   WhatsApp and recompressed still scans.
 * - **Error correction M** for a screen (prd.md §12 requirement 8); H is for
 *   print, which v1 does not do.
 * - **Quiet zone of four modules**, the standard's own, which design.md's QR
 *   block calls the default. Black on white whatever the theme: a scanner
 *   reads contrast, not tokens.
 */
const OPTIONS: QRCodeRenderersOptions = {
  errorCorrectionLevel: 'M',
  margin: 4,
  width: 480,
  color: { dark: '#000000', light: '#ffffff' },
}

/** The PNG itself, for an attachment or a download. */
export function entryQrPng(url: string): Promise<Buffer> {
  return toBuffer(url, { ...OPTIONS, type: 'png' })
}

/** The same PNG as a `data:` URL, for an `<img>` drawn on the server. */
export function entryQrDataUrl(url: string): Promise<string> {
  return toDataURL(url, { ...OPTIONS, type: 'image/png' })
}
