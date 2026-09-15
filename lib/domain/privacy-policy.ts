/**
 * The privacy policy on the public site (capability F10).
 *
 * Staff write it in a rich text editor; what is stored is **plain text** in a
 * small, fixed format, and this module is the only thing that reads or writes
 * it. Five constructions, and nothing else:
 *
 * - a line starting `#` (any number, then a space) is a heading;
 * - a line starting `-`, `*` or `•` and a space is a bullet point;
 * - a line starting a number, `.` or `)`, and a space is a numbered item —
 *   neighbouring items of one kind are one list, and a blank line between
 *   them does not split it;
 * - every other line is its own paragraph;
 * - `**` either side of words makes them bold, anywhere in a line.
 *
 * A backslash makes the next character literal, which is how a paragraph that
 * genuinely starts "2026." or a sentence with an asterisk in it survives a
 * save. `privacyPolicyText()` writes those escapes; nobody types them.
 *
 * **Why text, when staff never see it.** The editor (TipTap) is a way of
 * producing this format, not a storage format of its own: the published
 * versions, the data export and the public page all read the same text they
 * read before the editor existed, nothing stored is HTML, and the page renders
 * the blocks below as React elements — so nothing typed or pasted can become
 * markup on the site.
 *
 * **What it says is not checked**, and cannot be: whether a notice satisfies
 * the PDPO is the client's to decide (prd.md §13, open question R5). The one
 * rule about content is the template's own — a `[Fill in: …]` gap left in
 * cannot be published — and publish_privacy_policy() repeats it.
 */

/** Mirrors the CHECKs on `privacy_policy` and `privacy_policy_version`. */
export const MAX_PRIVACY_POLICY_LENGTH = 50_000

/* ── What a refusal says ──────────────────────────────────────────────────── */

const MESSAGES = {
  too_long: `Keep the policy under ${MAX_PRIVACY_POLICY_LENGTH.toLocaleString('en-GB')} characters.`,
  empty: 'Write the policy before publishing it.',
  unfilled: 'Fill in every [Fill in: …] gap before publishing.',
  stale:
    'Somebody else saved the policy while you had it open. Copy anything you want to keep, then reload the page to see their version.',
  actor_required: 'Sign in again, then try that once more.',
} as const

/** A refusal code from the database, in a sentence for the screen. */
export function privacyPolicyWriteMessage(code: string): string {
  return (
    (MESSAGES as Readonly<Record<string, string>>)[code] ??
    'The privacy policy could not be saved. Try again.'
  )
}

/* ── The blocks ───────────────────────────────────────────────────────────── */

/** A stretch of text that is bold or is not. */
export interface PrivacyPolicyRun {
  text: string
  bold: boolean
}

export type PrivacyPolicyRuns = readonly PrivacyPolicyRun[]

export type PrivacyPolicyBlock =
  | { kind: 'heading'; runs: PrivacyPolicyRuns }
  | { kind: 'paragraph'; runs: PrivacyPolicyRuns }
  | { kind: 'list'; ordered: boolean; items: readonly PrivacyPolicyRuns[] }

const HEADING = /^#+(?:\s+(.*))?$/
const BULLET = /^[-*•](?:\s+(.*))?$/
const NUMBERED = /^\d+[.)](?:\s+(.*))?$/
/** A paragraph whose first character would otherwise read as a construction. */
const ESCAPED_START = /^\\([#\-•\d])/
const PLACEHOLDER = /\[Fill in:\s*([^\]]*)\]/gi

/**
 * Line endings made one kind, trailing spaces dropped from every line, and the
 * whole trimmed, so a paste from Windows and the same words typed on a Mac are
 * one text.
 */
export function tidyPrivacyPolicy(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .trim()
}

/** The text as the page shows it: headings, paragraphs and lists, in order. */
export function parsePrivacyPolicy(text: string): PrivacyPolicyBlock[] {
  const blocks: PrivacyPolicyBlock[] = []
  let list: { ordered: boolean; items: PrivacyPolicyRuns[] } | null = null

  const closeList = () => {
    if (list && list.items.length > 0) {
      blocks.push({ kind: 'list', ordered: list.ordered, items: list.items })
    }

    list = null
  }

  const addItem = (ordered: boolean, source: string | undefined) => {
    if (list?.ordered !== ordered) {
      closeList()
      list = { ordered, items: [] }
    }

    const runs = parseRuns(source?.trim() ?? '')

    if (runs.length > 0) {
      list.items.push(runs)
    }
  }

  for (const raw of tidyPrivacyPolicy(text).split('\n')) {
    const line = raw.trim()

    if (line === '') {
      continue
    }

    const escaped = ESCAPED_START.exec(line)

    if (escaped) {
      closeList()
      pushText(blocks, 'paragraph', line.slice(1))
      continue
    }

    const bullet = BULLET.exec(line)

    if (bullet) {
      addItem(false, bullet[1])
      continue
    }

    const numbered = NUMBERED.exec(line)

    if (numbered) {
      addItem(true, numbered[1])
      continue
    }

    closeList()

    const heading = HEADING.exec(line)

    if (heading) {
      pushText(blocks, 'heading', heading[1]?.trim() ?? '')
      continue
    }

    pushText(blocks, 'paragraph', line)
  }

  closeList()

  return blocks
}

function pushText(
  blocks: PrivacyPolicyBlock[],
  kind: 'heading' | 'paragraph',
  source: string,
): void {
  const runs = parseRuns(source)

  if (runs.length > 0) {
    blocks.push({ kind, runs })
  }
}

/**
 * One line's words, split where `**` turns bold on and off.
 *
 * A `**` with no partner is literal — "5** stars" is not the start of a bold
 * stretch that never ends — and a backslash makes the next character literal.
 */
export function parseRuns(source: string): PrivacyPolicyRun[] {
  const delimiters: number[] = []

  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === '\\') {
      index += 1
    } else if (source[index] === '*' && source[index + 1] === '*') {
      delimiters.push(index)
      index += 1
    }
  }

  if (delimiters.length % 2 === 1) {
    delimiters.pop()
  }

  const toggles = new Set(delimiters)
  const runs: PrivacyPolicyRun[] = []
  let bold = false
  let buffer = ''

  const flush = () => {
    appendRun(runs, { text: buffer, bold })
    buffer = ''
  }

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]!

    if (character === '\\' && index + 1 < source.length) {
      buffer += source[index + 1]
      index += 1
    } else if (toggles.has(index)) {
      flush()
      bold = !bold
      index += 1
    } else {
      buffer += character
    }
  }

  flush()

  return runs
}

/** Adds a run, merging it into the last one when their weight matches. */
function appendRun(runs: PrivacyPolicyRun[], run: PrivacyPolicyRun): void {
  if (run.text === '') {
    return
  }

  const last = runs.at(-1)

  if (last && last.bold === run.bold) {
    runs[runs.length - 1] = { text: last.text + run.text, bold: last.bold }
  } else {
    runs.push(run)
  }
}

/* ── Back to text ─────────────────────────────────────────────────────────── */

/** The stored text for some blocks — what the editor saves. */
export function privacyPolicyText(blocks: readonly PrivacyPolicyBlock[]): string {
  const lines = blocks.flatMap((block): string[] => {
    switch (block.kind) {
      case 'heading':
        return [`## ${runsText(block.runs)}`]
      case 'paragraph': {
        const source = runsText(block.runs)

        // A paragraph that starts like a construction is escaped, so it reads
        // back as the paragraph it is.
        // Asterisks are already escaped, so these are the only starts left.
        return [/^[#\-•\d]/.test(source) ? `\\${source}` : source]
      }
      case 'list':
        return block.items.map((runs, index) =>
          block.ordered ? `${index + 1}. ${runsText(runs)}` : `- ${runsText(runs)}`,
        )
    }
  })

  return tidyPrivacyPolicy(lines.join('\n'))
}

/**
 * A line's runs as text. Bold that starts or ends on a space moves the space
 * outside it — the editor makes "`Email: `" bold as easily as "`Email:`", and
 * `**Email:** us` is the line anybody reading the export would expect.
 */
function runsText(runs: PrivacyPolicyRuns): string {
  return trimRuns(runs)
    .map((run) => {
      if (!run.bold) {
        return escapeText(run.text)
      }

      const [, lead = '', core = '', trail = ''] = /^(\s*)([\s\S]*?)(\s*)$/.exec(run.text) ?? []

      return core === '' ? run.text : `${lead}**${escapeText(core)}**${trail}`
    })
    .join('')
}

function escapeText(text: string): string {
  return text.replace(/[\\*]/g, (character) => `\\${character}`)
}

/** A line's runs merged, with whitespace trimmed off its two ends and no empty runs. */
export function trimRuns(runs: PrivacyPolicyRuns): PrivacyPolicyRun[] {
  const merged: PrivacyPolicyRun[] = []

  for (const run of runs) {
    appendRun(merged, run)
  }

  if (merged.length === 0) {
    return []
  }

  const first = merged[0]!
  const lastIndex = merged.length - 1

  merged[0] = { text: first.text.replace(/^\s+/, ''), bold: first.bold }
  merged[lastIndex] = {
    text: merged[lastIndex]!.text.replace(/\s+$/, ''),
    bold: merged[lastIndex]!.bold,
  }

  return merged.filter((run) => run.text !== '')
}

/**
 * The text as the editor would save it. Two spellings of one policy — `* item`
 * and `- item`, a stray `##` — become one, which is what "has anything
 * changed" and "is this what the website shows" compare.
 */
export function normalisePrivacyPolicy(text: string): string {
  return privacyPolicyText(parsePrivacyPolicy(text))
}

/* ── Checks ───────────────────────────────────────────────────────────────── */

/** What each `[Fill in: …]` gap asks for, in the order they appear. */
export function unfilledPlaceholders(text: string): string[] {
  return [...text.matchAll(PLACEHOLDER)].map((match) => (match[1] ?? '').trim())
}

export type PrivacyPolicyCheck = { ok: true; value: string } | { ok: false; error: string }

/** A draft may be anything, including empty, as long as it fits. */
export function checkPrivacyPolicyDraft(text: string): PrivacyPolicyCheck {
  const value = normalisePrivacyPolicy(text)

  return value.length > MAX_PRIVACY_POLICY_LENGTH
    ? { ok: false, error: MESSAGES.too_long }
    : { ok: true, value }
}

/** What may go on the website: something, that fits, with every gap filled. */
export function checkPrivacyPolicyForPublishing(text: string): PrivacyPolicyCheck {
  const draft = checkPrivacyPolicyDraft(text)

  if (!draft.ok) {
    return draft
  }

  if (draft.value === '') {
    return { ok: false, error: MESSAGES.empty }
  }

  if (unfilledPlaceholders(draft.value).length > 0) {
    return { ok: false, error: MESSAGES.unfilled }
  }

  return draft
}

export type PrivacyPolicyStatus = 'unpublished' | 'published' | 'draft_ahead'

/**
 * Where the policy stands, for the portal's status line.
 *
 * `draft_ahead` is a saved draft the website does not show yet — the state
 * somebody most needs told about, because the page they are looking at is not
 * the page a guest is.
 */
export function privacyPolicyStatus(input: {
  draft: string
  published: string | null
}): PrivacyPolicyStatus {
  if (input.published === null) {
    return 'unpublished'
  }

  return normalisePrivacyPolicy(input.draft) === normalisePrivacyPolicy(input.published)
    ? 'published'
    : 'draft_ahead'
}
