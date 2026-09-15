import { describe, expect, test } from 'vitest'

import type { PropertyContact } from './contact'
import {
  checkPrivacyPolicyDraft,
  checkPrivacyPolicyForPublishing,
  MAX_PRIVACY_POLICY_LENGTH,
  normalisePrivacyPolicy,
  parsePrivacyPolicy,
  parseRuns,
  privacyPolicyStatus,
  privacyPolicyText,
  privacyPolicyWriteMessage,
  tidyPrivacyPolicy,
  unfilledPlaceholders,
  type PrivacyPolicyRun,
} from './privacy-policy'
import { privacyPolicyTemplate } from './privacy-policy-template'

/**
 * The privacy policy's stored format (capability F10).
 *
 * What is worth proving is the reading of that text — which lines are
 * headings, lists and paragraphs, and which words are bold — because it is
 * what a guest sees; that writing it back reads the same, because the editor
 * saves through it; and the one content rule there is: an unfilled template
 * gap never publishes.
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

function plain(text: string): PrivacyPolicyRun[] {
  return [{ text, bold: false }]
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
      { kind: 'heading', runs: plain('Who we are') },
      { kind: 'paragraph', runs: plain('We run a building.') },
      { kind: 'paragraph', runs: plain('We take bookings.') },
      { kind: 'heading', runs: plain('What we collect') },
      { kind: 'list', ordered: false, items: [plain('Your name'), plain('Your phone number')] },
      { kind: 'paragraph', runs: plain('That is all.') },
    ])
  })

  test('reads numbered lists, whichever number or mark each line carries', () => {
    expect(parsePrivacyPolicy('1. First\n7) Second\n3. Third')).toEqual([
      {
        kind: 'list',
        ordered: true,
        items: [plain('First'), plain('Second'), plain('Third')],
      },
    ])
  })

  test('starts a new list when bullets turn into numbers', () => {
    expect(parsePrivacyPolicy('- dash\n1. one')).toEqual([
      { kind: 'list', ordered: false, items: [plain('dash')] },
      { kind: 'list', ordered: true, items: [plain('one')] },
    ])
  })

  test('takes any number of hashes as a heading, and every bullet mark Word pastes', () => {
    expect(parsePrivacyPolicy('# One\n### Three\n* star\n• dot\n- dash')).toEqual([
      { kind: 'heading', runs: plain('One') },
      { kind: 'heading', runs: plain('Three') },
      { kind: 'list', ordered: false, items: [plain('star'), plain('dot'), plain('dash')] },
    ])
  })

  test('keeps items separated by blank lines as one list', () => {
    expect(parsePrivacyPolicy('- one\n\n- two\n\n\n- three')).toEqual([
      { kind: 'list', ordered: false, items: [plain('one'), plain('two'), plain('three')] },
    ])
  })

  test('drops a bare mark with nothing after it rather than rendering an empty heading or item', () => {
    expect(parsePrivacyPolicy('##\n-\n1.\nText')).toEqual([
      { kind: 'paragraph', runs: plain('Text') },
    ])
  })

  test('does not mistake a hyphenated, starred, tagged or dated line for a construction', () => {
    expect(parsePrivacyPolicy('-5 degrees\n#hashtag\n2026 was a year')).toEqual([
      { kind: 'paragraph', runs: plain('-5 degrees') },
      { kind: 'paragraph', runs: plain('#hashtag') },
      { kind: 'paragraph', runs: plain('2026 was a year') },
    ])
  })

  test('reads an escaped line as the paragraph it is', () => {
    expect(parsePrivacyPolicy('\\2026. A year\n\\- not a bullet\n\\## not a heading')).toEqual([
      { kind: 'paragraph', runs: plain('2026. A year') },
      { kind: 'paragraph', runs: plain('- not a bullet') },
      { kind: 'paragraph', runs: plain('## not a heading') },
    ])
  })

  test('renders markup as the text it is', () => {
    expect(parsePrivacyPolicy('<script>alert(1)</script>')).toEqual([
      { kind: 'paragraph', runs: plain('<script>alert(1)</script>') },
    ])
  })

  test('reads nothing from empty text', () => {
    expect(parsePrivacyPolicy('  \n\n ')).toEqual([])
  })
})

describe('parseRuns', () => {
  test('splits a line where bold turns on and off', () => {
    expect(parseRuns('Contact **our officer** today')).toEqual([
      { text: 'Contact ', bold: false },
      { text: 'our officer', bold: true },
      { text: ' today', bold: false },
    ])
  })

  test('keeps a ** with no partner as the characters it is', () => {
    expect(parseRuns('Only 5** here')).toEqual(plain('Only 5** here'))
    expect(parseRuns('**Bold** and 5** stars')).toEqual([
      { text: 'Bold', bold: true },
      { text: ' and 5** stars', bold: false },
    ])
  })

  test('makes the character after a backslash literal', () => {
    expect(parseRuns('a \\*\\* b \\\\ c')).toEqual(plain('a ** b \\ c'))
  })
})

describe('privacyPolicyText', () => {
  test('writes every construction the way it is read', () => {
    const text = privacyPolicyText([
      { kind: 'heading', runs: plain('Who we are') },
      {
        kind: 'paragraph',
        runs: [
          { text: 'We are ', bold: false },
          { text: 'Palm Villa', bold: true },
        ],
      },
      { kind: 'list', ordered: false, items: [plain('one'), plain('two')] },
      { kind: 'list', ordered: true, items: [plain('first'), plain('second')] },
    ])

    expect(text).toBe('## Who we are\nWe are **Palm Villa**\n- one\n- two\n1. first\n2. second')
  })

  test('escapes a paragraph that would otherwise read as a construction', () => {
    const blocks = [
      { kind: 'paragraph' as const, runs: plain('2026. A good year') },
      { kind: 'paragraph' as const, runs: plain('- not a bullet') },
      { kind: 'paragraph' as const, runs: plain('# not a heading') },
    ]

    expect(parsePrivacyPolicy(privacyPolicyText(blocks))).toEqual(blocks)
  })

  test('escapes asterisks and backslashes, so they come back as typed', () => {
    const blocks = [{ kind: 'paragraph' as const, runs: plain('5** rating, C:\\Files, *note*') }]

    expect(parsePrivacyPolicy(privacyPolicyText(blocks))).toEqual(blocks)
  })

  test('moves spaces at the edge of bold outside it, and trims the line', () => {
    expect(
      privacyPolicyText([
        {
          kind: 'paragraph',
          runs: [
            { text: ' Email: ', bold: true },
            { text: 'us ', bold: false },
          ],
        },
      ]),
    ).toBe('**Email:** us')
  })
})

describe('normalisePrivacyPolicy', () => {
  test('writes two spellings of one policy the same way', () => {
    expect(normalisePrivacyPolicy('# Title\n* a\n\n* b\n3) c')).toBe('## Title\n- a\n- b\n1. c')
  })

  test('changes nothing the second time', () => {
    const tricky = '## A **bold** title\n\\1. Not a list\n- item with \\* star\n2. numbered'
    const template = privacyPolicyTemplate(CONTACT)

    for (const text of [tricky, template]) {
      const once = normalisePrivacyPolicy(text)

      expect(normalisePrivacyPolicy(once)).toBe(once)
    }
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
  test('saves an empty draft', () => {
    expect(checkPrivacyPolicyDraft('  \r\n ')).toEqual({ ok: true, value: '' })
  })

  test('saves the text normalised, as the editor writes it', () => {
    expect(checkPrivacyPolicyDraft('# Title\r\n* item  ')).toEqual({
      ok: true,
      value: '## Title\n- item',
    })
  })

  test('refuses a draft longer than the database holds', () => {
    const result = checkPrivacyPolicyDraft('a'.repeat(MAX_PRIVACY_POLICY_LENGTH + 1))

    expect(result.ok).toBe(false)
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

  test('publishes a written policy', () => {
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

  test('is published when the draft is what the website shows, however it is spelled', () => {
    expect(privacyPolicyStatus({ draft: '* Text  \r\n', published: '- Text' })).toBe('published')
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
    const headings = parsePrivacyPolicy(template).flatMap((block) =>
      block.kind === 'heading' ? [block.runs.map((run) => run.text).join('')] : [],
    )

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
