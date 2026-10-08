import { checkUpload, MAX_DOCUMENT_BYTES } from '@/lib/domain/document'

/**
 * The guest's IC or passport, as the two public booking forms send it
 * (capability A7, Jason's team, 8 October 2026; open-questions.md N62).
 *
 * Compulsory on both forms: a booking made online carries the front of the
 * lead guest's IC or passport, or is not made. Read and checked here before
 * anything else is written or counted, so a file that will be refused costs
 * the guest nothing but a sentence beside the field — and never one of their
 * booking attempts, which the rate counters would otherwise spend.
 *
 * The browser has already made a photograph smaller (`IdentityField`, via
 * components/prepare-photo.ts), so a camera original reaches here well under
 * the limit. What is checked is what always is for a document: the size, and
 * the file's real type read from its own bytes rather than from its name.
 */

/** The form field the file arrives in. */
export const IDENTITY_FIELD = 'identity'

export type IdentityFileRead =
  { ok: true; file: { bytes: Uint8Array; filename: string } } | { ok: false; message: string }

const MISSING = 'Add a photo or PDF of the front of your IC or passport.'

const TOO_LARGE =
  'That file is larger than 4 MB. A photograph taken on a phone is usually well under it, or send a smaller PDF.'

export async function readIdentityFile(formData: FormData): Promise<IdentityFileRead> {
  const file = formData.get(IDENTITY_FIELD)

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: MISSING }
  }

  if (file.size > MAX_DOCUMENT_BYTES) {
    return { ok: false, message: TOO_LARGE }
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const checked = checkUpload('identity', bytes)

  if (!checked.ok) {
    return { ok: false, message: checked.error.message }
  }

  return { ok: true, file: { bytes, filename: file.name || 'identity' } }
}

/**
 * Whether the honeypot was filled — asked of the raw form before anything else
 * is read, so a robot never costs the server the work of reading a 4 MB file.
 * The parsed check after it stays, and says the same thing.
 */
export function honeypotFilled(formData: FormData): boolean {
  const value = formData.get('website')

  return typeof value === 'string' && value.trim() !== ''
}

/**
 * The guest's details as they typed them, for the form to show again after a
 * refusal — read from the raw form rather than from the parsed one, so a
 * refusal by the schema itself echoes them too instead of blanking the name
 * and email the guest had already filled in.
 */
export function echoedDetails(formData: FormData): Record<string, string> {
  // Capped: it is only the caller's own input handed back to them, but there
  // is no reason to echo more than any of these fields could hold.
  const text = (field: string) => {
    const value = formData.get(field)

    return typeof value === 'string' ? value.slice(0, 200) : ''
  }

  return {
    guestName: text('guestName'),
    guestPhone: text('guestPhone'),
    guestEmail: text('guestEmail'),
    vehicles: text('vehicles'),
  }
}
