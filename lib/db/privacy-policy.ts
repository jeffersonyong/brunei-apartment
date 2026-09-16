import { cache } from 'react'

import { privacyPolicyWriteMessage } from '@/lib/domain/privacy-policy'
import { dataClient } from '@/lib/supabase/data'

import { currentPropertyId } from './property'

/**
 * The privacy policy on the public site (capability F10).
 *
 * Thin over the two writers in 20260930000100, which hold the stale check and
 * the audit event under one lock per property. What this adds is the refusal
 * codes turned into sentences.
 *
 * **It checks no permissions** (architecture.md §4). `requirePermission()` is
 * the first line of every server action that calls this, and the text it is
 * given has already been through lib/domain/privacy-policy.ts. The readers of
 * the published policy are public: the website shows it to anybody.
 */

/** Far more versions than a property will publish; the screen lists them all. */
const VERSION_LIMIT = 200

export interface PrivacyPolicyDraft {
  text: string
  /** Null when nothing has ever been saved. The editor sends it back as-is. */
  updatedAt: string | null
  updatedBy: string | null
}

export interface PublishedPrivacyPolicy {
  id: string
  body: string
  publishedAt: string
  publishedBy: string | null
}

export type PrivacyPolicyVersionSummary = Omit<PublishedPrivacyPolicy, 'body'>

export interface PrivacyPolicyWriteError {
  code: string
  message: string
}

export type PrivacyPolicyWriteResult<T extends object> =
  ({ ok: true } & T) | { ok: false; error: PrivacyPolicyWriteError }

interface RpcRefusal {
  ok: false
  error: string
}

interface VersionRow {
  id: string
  body: string
  published_at: string
  published_by: string | null
}

function refused(code: string): { ok: false; error: PrivacyPolicyWriteError } {
  return { ok: false, error: { code, message: privacyPolicyWriteMessage(code) } }
}

/* ── Reading ──────────────────────────────────────────────────────────────── */

/** The working copy, or an empty one when nobody has saved anything yet. */
export async function readPrivacyPolicyDraft(): Promise<PrivacyPolicyDraft> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient()
    .from('privacy_policy')
    .select('draft, updated_at, updated_by')
    .eq('property_id', propertyId)
    .maybeSingle()

  if (error) {
    throw new Error(`Could not read the privacy policy draft: ${error.message}`)
  }

  const row = data as { draft: string; updated_at: string; updated_by: string | null } | null

  return row
    ? { text: row.draft, updatedAt: row.updated_at, updatedBy: row.updated_by }
    : { text: '', updatedAt: null, updatedBy: null }
}

/** What the website shows, or null when nothing has been published. */
export async function readPublishedPrivacyPolicy(): Promise<PublishedPrivacyPolicy | null> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient()
    .from('privacy_policy_version')
    .select('id, body, published_at, published_by')
    .eq('property_id', propertyId)
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Could not read the published privacy policy: ${error.message}`)
  }

  const row = data as VersionRow | null

  return row
    ? {
        id: row.id,
        body: row.body,
        publishedAt: row.published_at,
        publishedBy: row.published_by,
      }
    : null
}

/**
 * Whether the website has a policy to link to — the footer's question, asked
 * on every public page, so it reads no text.
 *
 * Cached for the request: the footer asks it from the public layout, and a page
 * that links the policy itself (the customer's booking page) asks again.
 */
export const isPrivacyPolicyPublished = cache(async (): Promise<boolean> => {
  const propertyId = await currentPropertyId()

  const { count, error } = await dataClient()
    .from('privacy_policy_version')
    .select('id', { count: 'exact', head: true })
    .eq('property_id', propertyId)

  if (error) {
    throw new Error(`Could not check for a published privacy policy: ${error.message}`)
  }

  return (count ?? 0) > 0
})

/** Every version published, newest first, without their text. */
export async function listPrivacyPolicyVersions(): Promise<readonly PrivacyPolicyVersionSummary[]> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient()
    .from('privacy_policy_version')
    .select('id, published_at, published_by')
    .eq('property_id', propertyId)
    .order('published_at', { ascending: false })
    .limit(VERSION_LIMIT)

  if (error) {
    throw new Error(`Could not read the privacy policy versions: ${error.message}`)
  }

  return (data as Omit<VersionRow, 'body'>[]).map((row) => ({
    id: row.id,
    publishedAt: row.published_at,
    publishedBy: row.published_by,
  }))
}

/* ── Writing ──────────────────────────────────────────────────────────────── */

/**
 * Saves the working copy. Refused as `stale` when somebody else saved it after
 * `expectedUpdatedAt`, which is the draft as the editor was opened on.
 */
export async function savePrivacyPolicyDraft(input: {
  text: string
  expectedUpdatedAt: string | null
  actorId: string
}): Promise<PrivacyPolicyWriteResult<{ changed: boolean; updatedAt: string | null }>> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient().rpc('save_privacy_policy_draft', {
    p_property_id: propertyId,
    p_draft: input.text,
    p_expected_updated_at: input.expectedUpdatedAt,
    p_actor_id: input.actorId,
  })

  if (error) {
    throw new Error(`Could not save the privacy policy draft: ${error.message}`)
  }

  const result = data as { ok: true; changed: boolean; updated_at: string | null } | RpcRefusal

  return result.ok
    ? { ok: true, changed: result.changed, updatedAt: result.updated_at }
    : refused(result.error)
}

/**
 * Saves the text as the draft and puts it on the website. `changed` is false
 * when the website already showed exactly this.
 */
export async function publishPrivacyPolicy(input: {
  text: string
  expectedUpdatedAt: string | null
  actorId: string
}): Promise<
  PrivacyPolicyWriteResult<{ changed: boolean; versionId: string; publishedAt: string }>
> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient().rpc('publish_privacy_policy', {
    p_property_id: propertyId,
    p_body: input.text,
    p_expected_updated_at: input.expectedUpdatedAt,
    p_actor_id: input.actorId,
  })

  if (error) {
    throw new Error(`Could not publish the privacy policy: ${error.message}`)
  }

  const result = data as
    { ok: true; changed: boolean; version_id: string; published_at: string } | RpcRefusal

  return result.ok
    ? {
        ok: true,
        changed: result.changed,
        versionId: result.version_id,
        publishedAt: result.published_at,
      }
    : refused(result.error)
}
