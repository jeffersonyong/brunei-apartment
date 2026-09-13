import { describe, expect, test } from 'vitest'

import { buildPasswordResetEmail, resetPasswordUrl } from '@/lib/domain/password-reset'

import { renderPasswordResetEmail } from './render'

/**
 * The staff password-reset email's markup (capability F8).
 *
 * It is an operations email, so it takes the operations register: monochrome,
 * an ink button, no Fraunces and no lagoon — design.md's rule that the brand
 * face and the brand hue belong to the customer surface alone, carried into a
 * third medium.
 */

const HASH = 'a'.repeat(28) + '0123456789abcdef0123456789ab'
const LINK = resetPasswordUrl('https://palmvilla.test', HASH)

/** design.md's neutral light-theme tokens, and nothing else. */
const MONOCHROME = new Set(['#111111', '#6b6b6b', '#ffffff', '#f3f3f3', '#e8e8e8'])

const hexesIn = (html: string): string[] =>
  (html.match(/#[0-9a-fA-F]{3,8}/g) ?? []).map((colour) => colour.toLowerCase())

function render(email = 'mary@example.com') {
  return renderPasswordResetEmail(buildPasswordResetEmail({ email, resetUrl: LINK }))
}

describe('the password reset email', () => {
  test('uses only the neutral tokens — no brand teal, no status hue', () => {
    // The link itself carries hex, and is not a colour.
    const used = hexesIn(render().html.replaceAll(HASH, ''))

    expect(used.length).toBeGreaterThan(0)

    for (const colour of used) {
      expect(MONOCHROME, `uses ${colour}`).toContain(colour)
    }
  })

  test('sets no display serif, which belongs to the customer surface', () => {
    expect(render().html).not.toContain('Fraunces')
  })

  test('fills its one button with ink and points it at the link', () => {
    const { html } = render()

    expect(html).toContain(`href="${LINK}"`)
    expect(html).toContain('background-color:#111111')
  })

  test('declares the light scheme and uses no CSS an email client cannot read', () => {
    const { html } = render()

    expect(html).toContain('color-scheme:light')
    expect(html).not.toContain('var(--')
    expect(html).not.toContain('class=')
  })

  test('escapes an address carrying markup', () => {
    const { html } = render('<b>mary</b>@example.com')

    expect(html).not.toContain('<b>mary</b>')
    expect(html).toContain('&lt;b&gt;mary&lt;/b&gt;@example.com')
  })

  test('has a plain-text body carrying the link and when it stops working', () => {
    const { text } = render()

    expect(text).toContain(LINK)
    expect(text).toContain('an hour')
    expect(text).not.toContain('<')
  })
})
