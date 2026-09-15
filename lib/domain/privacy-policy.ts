/**
 * The privacy policy on the public site (capability F10).
 *
 * Staff write it; this module decides what their text means. It is **one
 * document of plain text**, not rows of sections, because the likeliest
 * source is a lawyer's Word document pasted in whole. Three things in that
 * text carry structure, and nothing else does:
 *
 * - a line starting `#` (any number, then a space) is a heading;
 * - a line starting `-`, `*` or `•` and a space is a bullet point, and
 *   neighbouring bullets are one list — a blank line between them does not
 *   split it, because Word pastes one;
 * - every other line is its own paragraph, which is the rule an FAQ answer
 *   already follows.
 *
 * **It never becomes HTML.** The page renders the blocks below as React
 * elements, so whatever is typed is text on the page and nothing more — no
 * markup library, no sanitiser, and nothing to escape.
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

export type PrivacyPolicyBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: readonly string[] }

const HEADING = /^#+(?:\s+(.*))?$/
const BULLET = /^[-*•](?:\s+(.*))?$/
const PLACEHOLDER = /\[Fill in:\s*([^\]]*)\]/gi

/**
 * Line endings made one kind, trailing spaces dropped from every line, and the
 * whole trimmed. What is saved and compared, so a paste from Windows and the
 * same words typed on a Mac are one text.
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
  let items: string[] = []

  const closeList = () => {
    if (items.length > 0) {
      blocks.push({ kind: 'list', items })
      items = []
    }
  }

  for (const raw of tidyPrivacyPolicy(text).split('\n')) {
    const line = raw.trim()

    if (line === '') {
      continue
    }

    const bullet = BULLET.exec(line)

    if (bullet) {
      const item = bullet[1]?.trim() ?? ''

      if (item !== '') {
        items.push(item)
      }

      continue
    }

    closeList()

    const heading = HEADING.exec(line)

    if (heading) {
      const title = heading[1]?.trim() ?? ''

      if (title !== '') {
        blocks.push({ kind: 'heading', text: title })
      }

      continue
    }

    blocks.push({ kind: 'paragraph', text: line })
  }

  closeList()

  return blocks
}

/** What each `[Fill in: …]` gap asks for, in the order they appear. */
export function unfilledPlaceholders(text: string): string[] {
  return [...text.matchAll(PLACEHOLDER)].map((match) => (match[1] ?? '').trim())
}

export type PrivacyPolicyCheck = { ok: true; value: string } | { ok: false; error: string }

/** A draft may be anything, including empty, as long as it fits. */
export function checkPrivacyPolicyDraft(text: string): PrivacyPolicyCheck {
  const value = tidyPrivacyPolicy(text)

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

  return tidyPrivacyPolicy(input.draft) === tidyPrivacyPolicy(input.published)
    ? 'published'
    : 'draft_ahead'
}
