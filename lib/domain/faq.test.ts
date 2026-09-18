import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  FAQ_FIGURES,
  FAQ_TOPICS,
  MAX_ANSWER_LENGTH,
  MAX_FEATURED_FAQS,
  MAX_QUESTION_LENGTH,
  checkFaqDraft,
  faqFactsFrom,
  faqsByTopic,
  frontPageFaqs,
  renderFaqAnswer,
  slugFromQuestion,
  typedMoneyFigures,
  unknownFigures,
  type Faq,
  type FaqFacts,
} from './faq'
import { bnd } from './money'
import type { PropertySettings } from './settings'

/**
 * The FAQs staff write (capability F9).
 *
 * The answers are staff's words now, so what is left to test is the machinery
 * that keeps those words honest: a `{figure}` fills in from settings rather
 * than being typed, a figure nobody can fill in is refused before it reaches
 * the site, and the defaults the migration seeds obey both rules.
 */

const settings: PropertySettings = {
  propertyId: 'p1',
  name: 'Palm Villa',
  timeZone: 'Asia/Brunei',
  currency: 'BND',
  settingsUpdatedAt: '2026-09-16T00:00:00.000Z',
  policy: {
    paxPolicy: 'surcharge_threshold',
    extraPersonPerNightCents: bnd(7),
    paxExemptAgeMax: 3,
    earlyCheckInPerHourCents: bnd(15),
    lateCheckOutPerHourCents: bnd(15),
    checkInTime: '14:00',
    checkOutTime: '12:00',
    securityDepositCents: bnd(100),
    maxAdvanceBookingDays: 62,
  },
  extras: [
    {
      id: 'e1',
      slug: 'sofa-bed',
      name: 'Sofa bed',
      description: 'Includes one pillow and one blanket.',
      fee: bnd(28),
      stock: null,
      bookable: true,
      sortOrder: 1,
      retiredAt: null,
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  unitTypes: [
    {
      id: 'u1',
      slug: 'three-bedroom',
      name: 'Three-bedroom apartment',
      baseRateCents: bnd(180),
      maxPax: 6,
      carParks: 2,
    },
    {
      id: 'u2',
      slug: 'two-bedroom',
      name: 'Two-bedroom apartment',
      baseRateCents: bnd(150),
      maxPax: 4,
      carParks: 2,
    },
  ],
  bands: [
    { id: 'b1', label: 'Child 1–11', minAge: 1, maxAgeExclusive: 12, priceCents: bnd(5) },
    { id: 'b2', label: 'Adult 12+', minAge: 12, maxAgeExclusive: null, priceCents: bnd(10) },
  ],
  bundles: [
    {
      id: 'x1',
      label: '2 adults + 1 child',
      priceCents: bnd(20),
      sortOrder: 1,
      lines: [
        { bandId: 'b2', headcount: 2 },
        { bandId: 'b1', headcount: 1 },
      ],
    },
  ],
  facilities: [
    {
      id: 'f1',
      slug: 'pool',
      name: 'the pool',
      includedInDayPass: true,
      dayPassCapacity: null,
      shownOnSite: true,
      sortOrder: 1,
    },
    {
      id: 'f2',
      slug: 'bbq-area',
      name: 'the BBQ area',
      includedInDayPass: false,
      dayPassCapacity: null,
      shownOnSite: true,
      sortOrder: 2,
    },
  ],
  retention: [],
  bankAccounts: [{ id: 'a1', bankName: 'BIBD', accountNumber: '0018-02-0010611', sortOrder: 1 }],
}

const SELLABLE = new Set(['three-bedroom'])
const facts = faqFactsFrom(settings, SELLABLE)

function faq(overrides: Partial<Faq> = {}): Faq {
  return {
    id: overrides.id ?? 'q1',
    slug: overrides.slug ?? 'a-question',
    topic: overrides.topic ?? 'paying',
    question: overrides.question ?? 'A question?',
    answer: overrides.answer ?? 'An answer.',
    featured: overrides.featured ?? false,
    sortOrder: overrides.sortOrder ?? 1,
    updatedAt: overrides.updatedAt ?? '2026-09-14T00:00:00.000Z',
    updatedBy: overrides.updatedBy ?? null,
  }
}

describe('faqFactsFrom', () => {
  it('formats every money figure rather than passing cents through', () => {
    for (const figure of moneyIn(facts)) {
      expect(figure, figure).toMatch(/^BND \d+\.\d{2}$/)
    }
  })

  it('leaves out a unit type the building cannot sell', () => {
    expect(facts.unitTypes.map((type) => type.name)).toEqual(['Three-bedroom apartment'])
  })

  it('splits the facilities by whether a day pass covers them', () => {
    expect(facts.includedFacilities).toEqual(['the pool'])
    expect(facts.excludedFacilities).toEqual(['the BBQ area'])
  })
})

describe('FAQ_FIGURES', () => {
  it('names every figure once, in words a member of staff can read in an answer', () => {
    const keys = FAQ_FIGURES.map((figure) => figure.key)

    expect(new Set(keys).size).toBe(keys.length)

    for (const key of keys) {
      expect(key, key).toMatch(/^[a-z][a-z -]*[a-z]$/)
    }
  })

  it('fills every figure in with something, even when the list behind it is empty', () => {
    const bare: FaqFacts = {
      ...facts,
      includedFacilities: [],
      excludedFacilities: [],
      dayPassBands: [],
      dayPassBundles: [],
      bankAccounts: [],
      unitTypes: [],
    }

    for (const figure of FAQ_FIGURES) {
      expect(figure.render(facts).trim(), figure.key).not.toBe('')
      expect(figure.render(bare).trim(), figure.key).not.toBe('')
    }
  })
})

describe('renderFaqAnswer', () => {
  it('fills a figure in from settings', () => {
    expect(
      renderFaqAnswer('The {security deposit} security deposit secures the booking.', facts),
    ).toEqual(['The BND 100.00 security deposit secures the booking.'])
  })

  it('makes each line its own paragraph and drops the blank ones', () => {
    expect(
      renderFaqAnswer(
        'Check in from {check-in time}.\n\n  Check out by {check-out time}.  ',
        facts,
      ),
    ).toEqual(['Check in from 14:00.', 'Check out by 12:00.'])
  })

  it('fills in a list figure as one line', () => {
    expect(renderFaqAnswer('{nightly rates}', facts)).toEqual([
      'Three-bedroom apartment — from BND 180.00 a night',
    ])
    expect(renderFaqAnswer('Transfer to {bank accounts}.', facts)).toEqual([
      'Transfer to BIBD 0018-02-0010611.',
    ])
  })

  it('reads a figure however it was capitalised or spaced', () => {
    expect(renderFaqAnswer('{ Security  Deposit }', facts)).toEqual(['BND 100.00'])
  })

  it('leaves a figure it does not know as it was written', () => {
    expect(renderFaqAnswer('The {pool temperature} varies.', facts)).toEqual([
      'The {pool temperature} varies.',
    ])
  })
})

describe('unknownFigures', () => {
  it('lists the figures an answer asks for that nothing can fill in, once each', () => {
    expect(unknownFigures('{security deposit} {pool temperature} {Pool temperature}')).toEqual([
      'pool temperature',
    ])
  })

  it('is empty for an answer with no figures', () => {
    expect(unknownFigures('Call us.')).toEqual([])
  })
})

describe('typedMoneyFigures', () => {
  it('finds an amount typed in rather than inserted', () => {
    expect(typedMoneyFigures('It is BND 100 and then bnd 7.50 a night.')).toEqual([
      'BND 100',
      'bnd 7.50',
    ])
  })

  it('does not count an amount a figure fills in', () => {
    expect(typedMoneyFigures('The {security deposit} is refundable.')).toEqual([])
  })
})

describe('checkFaqDraft', () => {
  const draft = { topic: 'paying', question: 'How do we pay?', answer: 'By transfer.' }

  it('accepts a draft and tidies what staff typed', () => {
    expect(
      checkFaqDraft({
        topic: 'paying',
        question: '  How   do we pay? ',
        answer: 'By transfer.\r\n\r\n\r\n  Or cash.  ',
      }),
    ).toEqual({
      ok: true,
      value: { topic: 'paying', question: 'How do we pay?', answer: 'By transfer.\n\nOr cash.' },
    })
  })

  it('refuses a topic that is not one of the fixed topics', () => {
    const result = checkFaqDraft({ ...draft, topic: 'gossip' })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.errors.topic).toBeTruthy()
  })

  it('refuses an empty question or answer', () => {
    const result = checkFaqDraft({ ...draft, question: '   ', answer: '\n\n' })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.errors.question).toBeTruthy()
    expect(!result.ok && result.errors.answer).toBeTruthy()
  })

  it('refuses a question or answer longer than the site shows well', () => {
    const result = checkFaqDraft({
      ...draft,
      question: 'q'.repeat(MAX_QUESTION_LENGTH + 1),
      answer: 'a'.repeat(MAX_ANSWER_LENGTH + 1),
    })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.errors.question).toBeTruthy()
    expect(!result.ok && result.errors.answer).toBeTruthy()
  })

  it('refuses a figure nothing can fill in, and names it', () => {
    const result = checkFaqDraft({ ...draft, answer: 'The {pool temperature} varies.' })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.errors.answer).toContain('{pool temperature}')
  })
})

describe('slugFromQuestion', () => {
  it('turns a question into an address fragment', () => {
    expect(slugFromQuestion('What’s the check-in time, and can we leave late?')).toBe(
      'whats-the-check-in-time-and-can-we-leave-late',
    )
  })

  it('keeps a long question to a readable length without a trailing hyphen', () => {
    const slug = slugFromQuestion(`${'word '.repeat(40)}end?`)

    expect(slug.length).toBeLessThanOrEqual(80)
    expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('cuts one long unbroken word at the limit rather than a character short of it', () => {
    expect(slugFromQuestion('a'.repeat(120))).toBe('a'.repeat(80))
  })

  it('still gives a question of nothing but symbols an address', () => {
    expect(slugFromQuestion('???')).toBe('question')
  })
})

describe('faqsByTopic', () => {
  it('groups in the fixed topic order, each by its own order, and drops empty topics', () => {
    const groups = faqsByTopic([
      faq({ id: 'b', topic: 'paying', sortOrder: 2 }),
      faq({ id: 'a', topic: 'paying', sortOrder: 1 }),
      faq({ id: 'c', topic: 'day-passes', sortOrder: 1 }),
    ])

    expect(groups.map((group) => group.topic.id)).toEqual(['day-passes', 'paying'])
    expect(groups[1]?.faqs.map((entry) => entry.id)).toEqual(['a', 'b'])
  })

  it('keeps the topics fixed, and in the order the page reads', () => {
    expect(FAQ_TOPICS.map((topic) => topic.id)).toEqual([
      'day-passes',
      'staying',
      'paying',
      'changing-and-arriving',
      'anything-else',
    ])
  })
})

describe('frontPageFaqs', () => {
  it('takes the featured ones in the order the FAQs page reads, up to the limit', () => {
    const many = Array.from({ length: MAX_FEATURED_FAQS + 2 }, (_, index) =>
      faq({ id: `f${index}`, topic: 'staying', sortOrder: index, featured: true }),
    )
    const chosen = frontPageFaqs([
      faq({ id: 'plain', topic: 'day-passes', featured: false }),
      faq({ id: 'first', topic: 'day-passes', featured: true }),
      ...many,
    ])

    expect(chosen).toHaveLength(MAX_FEATURED_FAQS)
    expect(chosen[0]?.id).toBe('first')
    expect(chosen.map((entry) => entry.id)).not.toContain('plain')
  })
})

/**
 * The defaults the migration seeds, read out of the SQL itself — the approach
 * audit-label.test.ts takes to the audit vocabulary. They are the first FAQs
 * every property gets, and they have to pass the same checks a member of staff
 * would be held to, carry no typed-in amount, and ask for no figure the site
 * cannot fill in.
 */
describe('the seeded FAQs', () => {
  const seeded = seededFaqs()

  it('are all read out of the migration', () => {
    expect(seeded.length).toBeGreaterThanOrEqual(15)
  })

  it('pass the checks staff are held to, with no typed-in amount', () => {
    for (const entry of seeded) {
      expect(checkFaqDraft(entry).ok, entry.slug).toBe(true)
      expect(typedMoneyFigures(entry.answer), entry.slug).toEqual([])
    }
  })

  it('give every entry an address nothing else uses', () => {
    const slugs = seeded.map((entry) => entry.slug)

    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('put no more on the front page than it shows', () => {
    expect(seeded.filter((entry) => entry.featured).length).toBeLessThanOrEqual(MAX_FEATURED_FAQS)
  })
})

interface SeededFaq {
  topic: string
  slug: string
  question: string
  answer: string
  featured: boolean
}

function seededFaqs(): SeededFaq[] {
  const sql = readFileSync(
    join(process.cwd(), 'supabase', 'migrations', '20260928000100_the_questions_staff_answer.sql'),
    'utf8',
  )
  const body = sql.slice(
    sql.indexOf('create function seed_faqs'),
    sql.indexOf('$function$;', sql.indexOf('create function seed_faqs')),
  )
  const row =
    /\(\s*'([a-z-]+)',\s*'([a-z0-9-]+)',\s*'((?:[^']|'')*)',\s*E'((?:[^'\\]|''|\\.)*)',\s*(true|false)\s*\)/g

  return [...body.matchAll(row)].map(
    ([, topic = '', slug = '', question = '', answer = '', featured]) => ({
      topic,
      slug,
      question: question.replace(/''/g, "'"),
      answer: answer.replace(/''/g, "'").replace(/\\n/g, '\n'),
      featured: featured === 'true',
    }),
  )
}

/** Every money string the facts carry, wherever it sits. */
function moneyIn(value: FaqFacts): string[] {
  return [
    value.securityDeposit,
    value.extraPersonPerNight,
    value.sofaBedFee ?? '',
    value.lateCheckOutPerHour,
    ...value.dayPassBands.map((band) => band.price),
    ...value.dayPassBundles.map((bundle) => bundle.price),
    ...value.unitTypes.map((type) => type.fromRate),
  ]
}
