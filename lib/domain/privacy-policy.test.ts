import { describe, expect, test } from 'vitest'

import type { PropertyContact } from './contact'
import {
  checkPrivacyPolicyDraft,
  checkPrivacyPolicyForPublishing,
  MAX_PRIVACY_POLICY_LENGTH,
  parsePrivacyPolicy,
  privacyPolicyStatus,
  privacyPolicyWriteMessage,
  tidyPrivacyPolicy,
  unfilledPlaceholders,
} from './privacy-policy'
import { privacyPolicyTemplate } from './privacy-policy-template'

/**
 * The privacy policy's text rules (capability F10).
 *
 * What is worth proving is the reading of a pasted document — which lines are
 * headings, bullets and paragraphs — because that is what a guest sees, and
 * the one content rule there is: an unfilled template gap never publishes.
 */

const CONTACT: PropertyContact = {
  phones: [
    { display: '+673 1111111', whatsappUrl: 'https://wa.me/6731111111' },
    { display: '+673 2222222', whatsappUrl: 'https://wa.me/6732222222' },
  ],
  whatsappUrl: 'https://wa.me/6731111111',
  instagramHandle: '@example',
  instagramUrl: 'https://instagram.com/example',
  tiktokHandle: '@example',
  tiktokUrl: 'https://tiktok.com/@example',
  mapsUrl: 'https://maps.example',
}

describe('tidyPrivacyPolicy', () => {
  test('makes Windows and old Mac line endings one kind, and trims each line and the whole', () => {
    expect(tidyPrivacyPolicy('  \r\n## Title  \r\nOne\rTwo\t\n\n')).toBe('## Title\nOne\nTwo')
  })
})

describe('parsePrivacyPolicy', () => {
  test('reads headings, paragraphs and bullet lists in order', () => {
    const text = [
      '## Who we are',
      'We run a building.',
      'We take bookings.',
      '## What we collect',
      '- Your name',
      '- Your phone number',
      'That is all.',
    ].join('\n')

    expect(parsePrivacyPolicy(text)).toEqual([
      { kind: 'heading', text: 'Who we are' },
      { kind: 'paragraph', text: 'We run a building.' },
      { kind: 'paragraph', text: 'We take bookings.' },
      { kind: 'heading', text: 'What we collect' },
      { kind: 'list', items: ['Your name', 'Your phone number'] },
      { kind: 'paragraph', text: 'That is all.' },
    ])
  })

  test('takes any number of hashes as a heading, and every bullet mark Word pastes', () => {
    expect(parsePrivacyPolicy('# One\n### Three\n* star\n• dot\n- dash')).toEqual([
      { kind: 'heading', text: 'One' },
      { kind: 'heading', text: 'Three' },
      { kind: 'list', items: ['star', 'dot', 'dash'] },
    ])
  })

  test('keeps bullets separated by blank lines as one list', () => {
    expect(parsePrivacyPolicy('- one\n\n- two\n\n\n- three')).toEqual([
      { kind: 'list', items: ['one', 'two', 'three'] },
    ])
  })

  test('drops a bare mark with nothing after it rather than rendering an empty heading or bullet', () => {
    expect(parsePrivacyPolicy('##\n-\nText')).toEqual([{ kind: 'paragraph', text: 'Text' }])
  })

  test('does not mistake a hyphenated or starred word for a bullet', () => {
    expect(parsePrivacyPolicy('-5 degrees\n*important*\n#hashtag')).toEqual([
      { kind: 'paragraph', text: '-5 degrees' },
      { kind: 'paragraph', text: '*important*' },
      { kind: 'paragraph', text: '#hashtag' },
    ])
  })

  test('renders markup as the text it is', () => {
    expect(parsePrivacyPolicy('<script>alert(1)</script>')).toEqual([
      { kind: 'paragraph', text: '<script>alert(1)</script>' },
    ])
  })

  test('reads nothing from empty text', () => {
    expect(parsePrivacyPolicy('  \n\n ')).toEqual([])
  })
})

describe('unfilledPlaceholders', () => {
  test('lists what each gap asks for, in order, whatever its case', () => {
    expect(unfilledPlaceholders('A [Fill in: your name] and [fill in:  an email ].')).toEqual([
      'your name',
      'an email',
    ])
  })

  test('ignores ordinary brackets', () => {
    expect(unfilledPlaceholders('Our [registered] address (see below)')).toEqual([])
  })
})

describe('checkPrivacyPolicyDraft', () => {
  test('saves an empty draft, tidied', () => {
    expect(checkPrivacyPolicyDraft('  \r\n ')).toEqual({ ok: true, value: '' })
  })

  test('refuses a draft longer than the database holds', () => {
    const result = checkPrivacyPolicyDraft('a'.repeat(MAX_PRIVACY_POLICY_LENGTH + 1))

    expect(result.ok).toBe(false)
  })

  test('counts the length after tidying, so trailing spaces cannot push it over', () => {
    const text = `${'a'.repeat(MAX_PRIVACY_POLICY_LENGTH)}     \n\n`

    expect(checkPrivacyPolicyDraft(text)).toEqual({
      ok: true,
      value: 'a'.repeat(MAX_PRIVACY_POLICY_LENGTH),
    })
  })
})

describe('checkPrivacyPolicyForPublishing', () => {
  test('refuses an empty policy', () => {
    expect(checkPrivacyPolicyForPublishing(' \n ')).toEqual({
      ok: false,
      error: privacyPolicyWriteMessage('empty'),
    })
  })

  test('refuses a policy with a template gap left in', () => {
    expect(checkPrivacyPolicyForPublishing('## Contact\nEmail: [Fill in: an email]')).toEqual({
      ok: false,
      error: privacyPolicyWriteMessage('unfilled'),
    })
  })

  test('publishes a written policy, tidied', () => {
    expect(checkPrivacyPolicyForPublishing('## Contact\r\nEmail us.  ')).toEqual({
      ok: true,
      value: '## Contact\nEmail us.',
    })
  })
})

describe('privacyPolicyStatus', () => {
  test('is unpublished until something has been published, whatever the draft holds', () => {
    expect(privacyPolicyStatus({ draft: '## Written', published: null })).toBe('unpublished')
  })

  test('is published when the draft is what the website shows, spacing aside', () => {
    expect(privacyPolicyStatus({ draft: 'Text  \r\n', published: 'Text' })).toBe('published')
  })

  test('says so when the saved draft has changes the website does not show', () => {
    expect(privacyPolicyStatus({ draft: 'New text', published: 'Old text' })).toBe('draft_ahead')
  })
})

describe('privacyPolicyWriteMessage', () => {
  test('says something for a code it does not know', () => {
    expect(privacyPolicyWriteMessage('teleported')).toMatch(/could not be saved/)
  })
})

describe('privacyPolicyTemplate', () => {
  const template = privacyPolicyTemplate(CONTACT)

  test('has the sections a notice under the PDPO gives a reason to have', () => {
    const headings = parsePrivacyPolicy(template)
      .filter((block) => block.kind === 'heading')
      .map((block) => block.text)

    expect(headings).toEqual([
      'Who we are',
      'What we collect',
      'Why we collect it',
      'Your consent',
      'Who we share it with',
      'How long we keep it',
      'How we protect it',
      'Seeing and correcting your data',
      'Contact us',
      'Changes to this policy',
    ])
  })

  test('cannot be published unedited', () => {
    expect(unfilledPlaceholders(template).length).toBeGreaterThan(0)
    expect(checkPrivacyPolicyForPublishing(template).ok).toBe(false)
  })

  test('publishes once every gap is filled', () => {
    const filled = template.replace(/\[Fill in:[^\]]*\]/gi, 'Filled in')

    expect(checkPrivacyPolicyForPublishing(filled).ok).toBe(true)
  })

  test('fills in the numbers it knows', () => {
    expect(template).toContain('+673 1111111, +673 2222222')
  })

  test('states no retention period, which is a setting rather than a sentence', () => {
    expect(template).not.toMatch(/\b\d+\s*(months?|years?)\b/i)
  })
})
