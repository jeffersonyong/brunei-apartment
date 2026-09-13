/**
 * Staff resetting their own password from an emailed link (capability F8): the
 * rules and the words, with no I/O.
 *
 * ── The token is the credential, so where it travels is the design ─────────
 *
 * GoTrue mints a recovery token and hands back its hash, and `verifyOtp`
 * accepts that hash and signs the account's owner in — so the hash is the
 * credential. Three rules follow from that. It rides in the link's
 * **fragment**, which a browser never sends to a server, so it cannot land in
 * an access log. Only the exact shape GoTrue issues is read back out of a link,
 * so nothing else reaches the auth server. And it is spent by pressing a
 * button, never by opening the page, because mail systems open links to scan
 * them (app/(auth)/reset-password/actions.ts).
 */

/**
 * How long a link works.
 *
 * GoTrue decides it — `otp_expiry` in supabase/config.toml locally, the Auth
 * settings on the hosted project. This is the number the email and the screens
 * promise, and a test fails if it stops being the local one.
 */
export const RESET_LINK_LIFETIME_MINUTES = 60

/** The lifetime as the email and the screens say it. */
export const RESET_LINK_LIFETIME_WORDS =
  RESET_LINK_LIFETIME_MINUTES === 60 ? 'an hour' : `${RESET_LINK_LIFETIME_MINUTES} minutes`

/**
 * The two counters on asking for a link — architecture.md §4a's construction.
 *
 * Constants rather than settings, for N37's reason: nobody has agreed these
 * figures, and a settings row invites raising the control on the day it is
 * doing its job.
 *
 * - **Per address, three an hour, failing closed.** It protects the person
 *   being emailed. Three is a person trying again after checking spam; a
 *   fourth is somebody else filling their inbox.
 * - **Per device, five an hour, failing open.** It keeps one caller from
 *   spreading the same abuse across many addresses, and the per-address limit
 *   behind it is what holds on the day the counter errors.
 */
export const PASSWORD_RESET_LIMITS = {
  requestsPerIpPerHour: 5,
  emailsPerAddressPerHour: 3,
} as const

/** GoTrue's recovery token hash: a sha224, in lowercase hex. */
const TOKEN_HASH = /^[a-f0-9]{56}$/

export function isRecoveryTokenHash(value: string): boolean {
  return TOKEN_HASH.test(value)
}

/** The link an email carries: the reset page, with the token in its fragment. */
export function resetPasswordUrl(origin: string, tokenHash: string): string {
  return `${origin}/reset-password#token=${tokenHash}`
}

/** The token in a link's fragment, or null when there is none of the right shape. */
export function tokenFromFragment(fragment: string): string | null {
  const token = new URLSearchParams(fragment.replace(/^#/, '')).get('token')

  return token !== null && isRecoveryTokenHash(token) ? token : null
}

export interface PasswordResetEmailModel {
  subject: string
  /** The line a mail app shows beside the subject. */
  preheader: string
  eyebrow: string
  headline: string
  intro: string
  action: { label: string; url: string; note: string }
  notes: readonly string[]
  footer: string
}

/**
 * What the email says.
 *
 * It names the account, so somebody holding two can tell which this is for,
 * and it tells somebody who did not ask that nothing has changed — the email
 * most often read by the wrong person is one they did not expect.
 */
export function buildPasswordResetEmail(input: {
  email: string
  resetUrl: string
}): PasswordResetEmailModel {
  return {
    subject: 'Choose a new password for Palm Villa Operations',
    preheader: `Somebody asked to reset your password. The link works once, for ${RESET_LINK_LIFETIME_WORDS}.`,
    eyebrow: 'Palm Villa Operations',
    headline: 'Choose a new password',
    intro: `Somebody asked to reset the password for the staff account ${input.email}. If it was you, choose a new one with the link below.`,
    action: {
      label: 'Choose a new password',
      url: input.resetUrl,
      note: `The link works once, for ${RESET_LINK_LIFETIME_WORDS}. Asking for another one cancels this one.`,
    },
    notes: [
      "If it wasn't you, ignore this email. Your password has not changed, and it can't be changed without this link.",
    ],
    footer: 'Sent because a password reset was asked for on the Palm Villa staff sign-in page.',
  }
}
