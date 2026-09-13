/**
 * The shortest password the product accepts, and the sentence refusing one.
 *
 * One number, enforced twice. The auth server refuses anything shorter when a
 * password is set (supabase/config.toml `minimum_password_length`); the app
 * checks first, on every form that sets one — a staff member's own change on
 * Settings, and an administrator's new account and reset in Roles & staff — so
 * the refusal arrives as a sentence beside the field. The test beside this file
 * fails if the two numbers disagree.
 *
 * Eight rather than GoTrue's floor of six. Signing in checks only that a
 * password was typed (app/(auth)/login/actions.ts), so one set before the
 * minimum rose still opens its account; the rule applies the next time it is
 * changed or reset.
 *
 * The hosted project does not read config.toml on deploy: its own Auth
 * setting has to be raised to match, with `supabase config push` or in the
 * dashboard.
 */
export const MIN_PASSWORD_LENGTH = 8

export const PASSWORD_TOO_SHORT = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
