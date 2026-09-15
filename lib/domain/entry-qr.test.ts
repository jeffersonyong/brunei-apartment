import { describe, expect, test } from 'vitest'

import type { BookingStatus } from './booking-state'
import {
  entryCodeShownFor,
  entryQrFilename,
  entrySummarySentence,
  entryUrl,
  isEntryToken,
  maskGuestName,
} from './entry-qr'

const TOKEN = 'Ab3xY9-_ZqRs7TuVwX2Kd0'

describe('isEntryToken', () => {
  test('accepts the 22-character base64url shape and nothing else', () => {
    expect(isEntryToken(TOKEN)).toBe(true)
    expect(isEntryToken(TOKEN.slice(1))).toBe(false)
    expect(isEntryToken(`${TOKEN}a`)).toBe(false)
    expect(isEntryToken('Ab3xY9+/ZqRs7TuVwX2Kd0')).toBe(false)
    expect(isEntryToken('PV-0042')).toBe(false)
    expect(isEntryToken('')).toBe(false)
  })
})

describe('entryUrl', () => {
  test('points at /c/{token} on the staff origin', () => {
    expect(entryUrl('https://portal.bruneiapartment.com', TOKEN)).toBe(
      `https://portal.bruneiapartment.com/c/${TOKEN}`,
    )
    expect(entryUrl('https://portal.bruneiapartment.com/', TOKEN)).toBe(
      `https://portal.bruneiapartment.com/c/${TOKEN}`,
    )
  })

  test('refuses to build a link out of a missing or malformed token', () => {
    expect(entryUrl('https://portal.bruneiapartment.com', null)).toBeNull()
    expect(entryUrl('https://portal.bruneiapartment.com', 'nope')).toBeNull()
  })

  test('refuses an origin that carries a path', () => {
    expect(entryUrl('https://portal.bruneiapartment.com/field', TOKEN)).toBeNull()
  })
})

describe('entryCodeShownFor', () => {
  test('only while the guest can still come through the gate on it', () => {
    const shown: BookingStatus[] = ['confirmed', 'checked_in']
    const hidden: BookingStatus[] = [
      'draft',
      'held',
      'awaiting_payment_verification',
      'completed',
      'expired',
      'cancelled',
      'no_show',
    ]

    for (const status of shown) {
      expect(entryCodeShownFor(status), status).toBe(true)
    }

    for (const status of hidden) {
      expect(entryCodeShownFor(status), status).toBe(false)
    }
  })
})

describe('entryQrFilename', () => {
  test('leads with the reference', () => {
    expect(entryQrFilename('PV-0042')).toBe('PV-0042-entry-qr.png')
  })

  test('cannot carry a quote or a line break into the download header', () => {
    expect(entryQrFilename('PV-0042"\r\nSet-Cookie: x=1')).toBe(
      'PV-0042Set-Cookiex1-entry-qr.png',
    )
  })
})

describe('maskGuestName', () => {
  test('keeps the first name and the next initial', () => {
    expect(maskGuestName('Siti Aminah binti Ali')).toBe('Siti A.')
    expect(maskGuestName('  john   doe ')).toBe('john D.')
  })

  test('reduces a one-word name to its initial', () => {
    expect(maskGuestName('Muhammad')).toBe('M.')
  })

  test('never returns an empty string', () => {
    expect(maskGuestName('   ')).toBe('Guest')
  })
})

describe('entrySummarySentence', () => {
  test('says where the booking stands without naming money or places', () => {
    expect(entrySummarySentence('confirmed')).toMatch(/confirmed/)
    expect(entrySummarySentence('cancelled')).toBe('This booking is no longer live.')
    expect(entrySummarySentence('awaiting_payment_verification')).toBe(
      'This booking is not confirmed yet.',
    )
  })
})
