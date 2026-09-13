import { cache } from 'react'

import type { User } from '@supabase/supabase-js'

import { recordAuditEvent } from '@/lib/db/audit'
import { currentPropertyId } from '@/lib/db/property'
import { dataClient } from '@/lib/supabase/data'

/**
 * Staff accounts and roles, for the F1/F2 admin screens and for a person's own
 * Settings.
 *
 * A staff member is an auth.users row plus user_role grants — there is no
 * profile table (architecture.md §3): the display name lives in
 * user_metadata, and "disabled" is a GoTrue ban rather than a flag, because
 * an account that has acted can never be deleted (the audit FK restricts it)
 * and banning is the reversible way to end its access.
 *
 * Every mutation here records an audit event. The role-set changes go through
 * the SQL functions of migration 001100, which make write and audit atomic;
 * the GoTrue-backed ones (create, ban, password reset) record theirs after
 * the API call succeeds.
 */

/** Long enough to outlive the venue; 'none' lifts it. GoTrue has no "forever". */
const BAN_FOREVER = '87600h'

export interface StaffRoleSummary {
  id: string
  slug: string
  name: string
}

export interface StaffAccount {
  id: string
  email: string
  displayName: string
  disabled: boolean
  roles: readonly StaffRoleSummary[]
}

export interface RoleWithPermissions {
  id: string
  slug: string
  name: string
  permissions: readonly string[]
}

/**
 * Whether an administrator has disabled the account: a GoTrue ban still
 * running. Read by the staff list and by the password reset email, which must
 * not send a disabled account a link GoTrue would refuse.
 */
export function isAccountDisabled(user: User): boolean {
  const bannedUntil = (user as { banned_until?: string }).banned_until

  return Boolean(bannedUntil && new Date(bannedUntil).getTime() > Date.now())
}

function toStaffAccount(user: User, roles: readonly StaffRoleSummary[]): StaffAccount {
  const metadataName = user.user_metadata?.display_name

  return {
    id: user.id,
    email: user.email ?? '',
    displayName:
      typeof metadataName === 'string' && metadataName.trim() !== ''
        ? metadataName
        : (user.email ?? ''),
    disabled: isAccountDisabled(user),
    roles,
  }
}

/**
 * Every staff account with its roles, alphabetical by name.
 *
 * One page of 200: the venue employs a handful of people, and an admin screen
 * that silently truncates at a limit nobody will reach is simpler than one
 * that pages.
 *
 * **Memoised per request**, and the only thing in `lib/db` that is. Nine
 * screens read this to turn an actor id into a name, the CSV export reads it
 * twice in one response (once to count, once for the rows), and none of them
 * can change it while they render. `cache()` is request-scoped machinery in a
 * layer that otherwise refuses it — the query layer has to run in Vitest,
 * where there is no request — so this is deliberate rather than incidental:
 * outside a request React's `cache` is a passthrough that simply does not
 * dedupe, which is exactly the old behaviour. No mutation path reads the
 * roster before and after its own write, so there is nothing here to go
 * stale within one request.
 */
export const listStaff = cache(async (): Promise<readonly StaffAccount[]> => {
  const propertyId = await currentPropertyId()

  // Three reads, none of which depends on another's answer, so they go out
  // together. They were awaited one after the next, and the first of them is
  // an HTTPS call to GoTrue rather than a query — so the roster was the
  // longest leg of every screen that shows who did something, and there are
  // nine of them.
  const [{ data: userData, error: userError }, { data: grantRows, error: grantError }, roles] =
    await Promise.all([
      dataClient().auth.admin.listUsers({ page: 1, perPage: 200 }),
      dataClient().from('user_role').select('user_id, role_id').eq('property_id', propertyId),
      listRoles(),
    ])

  if (userError) {
    throw new Error(`Could not list staff accounts: ${userError.message}`)
  }

  if (grantError) {
    throw new Error(`Could not read role grants: ${grantError.message}`)
  }

  const rolesById = new Map(roles.map((role) => [role.id, role]))
  const roleIdsByUser = new Map<string, string[]>()

  for (const row of grantRows as { user_id: string; role_id: string }[]) {
    const existing = roleIdsByUser.get(row.user_id) ?? []

    roleIdsByUser.set(row.user_id, [...existing, row.role_id])
  }

  return userData.users
    .map((user) =>
      toStaffAccount(
        user,
        (roleIdsByUser.get(user.id) ?? [])
          .map((roleId) => rolesById.get(roleId))
          .filter((role): role is StaffRoleSummary => role !== undefined)
          .sort((a, b) => a.name.localeCompare(b.name)),
      ),
    )
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
})

async function listRoles(): Promise<readonly StaffRoleSummary[]> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient()
    .from('staff_role')
    .select('id, slug, name')
    .eq('property_id', propertyId)
    .order('name')

  if (error) {
    throw new Error(`Could not read roles: ${error.message}`)
  }

  return data as StaffRoleSummary[]
}

/** The roles with their permission sets, for the Roles tab and the guards. */
export async function listRolesWithPermissions(): Promise<readonly RoleWithPermissions[]> {
  const propertyId = await currentPropertyId()
  const roles = await listRoles()

  const { data, error } = await dataClient()
    .from('role_permission')
    .select('role_id, permission')
    .eq('property_id', propertyId)

  if (error) {
    throw new Error(`Could not read role permissions: ${error.message}`)
  }

  const permissionsByRole = new Map<string, string[]>()

  for (const row of data as { role_id: string; permission: string }[]) {
    const existing = permissionsByRole.get(row.role_id) ?? []

    permissionsByRole.set(row.role_id, [...existing, row.permission])
  }

  return roles.map((role) => ({
    ...role,
    permissions: [...(permissionsByRole.get(role.id) ?? [])].sort(),
  }))
}

export interface CreateStaffAccountInput {
  email: string
  displayName: string
  tempPassword: string
  roleIds: readonly string[]
  actorId: string
}

export type CreateStaffAccountResult =
  { ok: true; userId: string } | { ok: false; error: { code: 'email_exists'; message: string } }

export async function createStaffAccount(
  input: CreateStaffAccountInput,
): Promise<CreateStaffAccountResult> {
  const { data, error } = await dataClient().auth.admin.createUser({
    email: input.email,
    password: input.tempPassword,
    // Provisioning is out-of-band: the admin hands over the temp password in
    // person or on WhatsApp, and no confirmation email exists to send
    // (architecture.md §3).
    email_confirm: true,
    user_metadata: { display_name: input.displayName },
  })

  if (error) {
    if (error.code === 'email_exists') {
      return {
        ok: false,
        error: { code: 'email_exists', message: 'An account with this email already exists.' },
      }
    }

    throw new Error(`Could not create the staff account: ${error.message}`)
  }

  // The password is never in the payload — the audit trail records that an
  // account was created, not what unlocks it.
  await recordAuditEvent({
    actorId: input.actorId,
    action: 'staff.account_created',
    entityType: 'staff_user',
    entityId: data.user.id,
    after: { email: input.email, display_name: input.displayName },
  })

  if (input.roleIds.length > 0) {
    await setUserRoles(data.user.id, input.roleIds, input.actorId)
  }

  return { ok: true, userId: data.user.id }
}

/** Replaces a user's role set; the SQL function audits it atomically. */
export async function setUserRoles(
  userId: string,
  roleIds: readonly string[],
  actorId: string,
): Promise<void> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient().rpc('set_user_roles', {
    p_property_id: propertyId,
    p_user_id: userId,
    p_role_ids: roleIds,
    p_actor_id: actorId,
  })

  if (error) {
    throw new Error(`Could not set roles: ${error.message}`)
  }

  const result = data as { ok: boolean }

  if (!result.ok) {
    throw new Error('Could not set roles.')
  }
}

export type SetRolePermissionsResult = { ok: true } | { ok: false; error: 'role_not_found' }

/** Replaces a role's permission set; the SQL function audits it atomically. */
export async function setRolePermissions(
  roleId: string,
  permissions: readonly string[],
  actorId: string,
): Promise<SetRolePermissionsResult> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient().rpc('set_role_permissions', {
    p_property_id: propertyId,
    p_role_id: roleId,
    p_permissions: permissions,
    p_actor_id: actorId,
  })

  if (error) {
    throw new Error(`Could not set the role's permissions: ${error.message}`)
  }

  return data as SetRolePermissionsResult
}

/**
 * Disables (or re-enables) an account via a GoTrue ban. An already-issued
 * access token stays valid until it expires — up to an hour — which is
 * accepted for v1 (architecture.md §3).
 */
export async function setAccountDisabled(
  userId: string,
  disabled: boolean,
  actorId: string,
): Promise<void> {
  const { error } = await dataClient().auth.admin.updateUserById(userId, {
    ban_duration: disabled ? BAN_FOREVER : 'none',
  })

  if (error) {
    throw new Error(`Could not ${disabled ? 'disable' : 'enable'} the account: ${error.message}`)
  }

  await recordAuditEvent({
    actorId,
    action: disabled ? 'staff.account_disabled' : 'staff.account_enabled',
    entityType: 'staff_user',
    entityId: userId,
  })
}

/** Sets a new temporary password, for a staff member locked out of theirs. */
export async function resetStaffPassword(
  userId: string,
  tempPassword: string,
  actorId: string,
): Promise<void> {
  const { error } = await dataClient().auth.admin.updateUserById(userId, {
    password: tempPassword,
  })

  if (error) {
    throw new Error(`Could not reset the password: ${error.message}`)
  }

  // The event says a reset happened; the password itself is never recorded.
  await recordAuditEvent({
    actorId,
    action: 'staff.password_reset',
    entityType: 'staff_user',
    entityId: userId,
  })
}

export type DeleteStaffAccountResult =
  { ok: true } | { ok: false; error: { code: 'has_history'; message: string } }

/**
 * Deletes an account that has never acted — a typo'd email, a duplicate
 * created by mistake.
 *
 * An account with any audit history is not deletable, by design: the
 * restrict FK on audit_event.actor_id (migration 001000) encodes the policy
 * that the trail's actors stay resolvable forever, and such accounts are
 * disabled instead. The check here exists to give that refusal a sentence;
 * the FK remains the enforcement, so an action racing in between the check
 * and the delete still cannot orphan the trail — the delete just fails.
 *
 * Role grants cascade away with the user; the deletion itself is recorded
 * (entity ids in audit_event are not foreign keys, so the event survives its
 * subject).
 */
export async function deleteStaffAccount(
  userId: string,
  actorId: string,
): Promise<DeleteStaffAccountResult> {
  const { count, error: countError } = await dataClient()
    .from('audit_event')
    .select('id', { count: 'exact', head: true })
    .eq('actor_id', userId)

  if (countError) {
    throw new Error(`Could not check the account's history: ${countError.message}`)
  }

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: {
        code: 'has_history',
        message: 'This account has acted and cannot be deleted — disable it instead.',
      },
    }
  }

  // Read identity before it is gone, so the audit event can say who this was.
  const { data: userData, error: readError } = await dataClient().auth.admin.getUserById(userId)

  if (readError || !userData.user) {
    throw new Error(`Could not read the account before deleting: ${readError?.message}`)
  }

  const { error } = await dataClient().auth.admin.deleteUser(userId)

  if (error) {
    // The FK backstop: an action landed between the history check and here.
    return {
      ok: false,
      error: {
        code: 'has_history',
        message: 'This account has acted and cannot be deleted — disable it instead.',
      },
    }
  }

  const metadataName = userData.user.user_metadata?.display_name

  await recordAuditEvent({
    actorId,
    action: 'staff.account_deleted',
    entityType: 'staff_user',
    entityId: userId,
    before: {
      email: userData.user.email ?? '',
      display_name: typeof metadataName === 'string' ? metadataName : '',
    },
  })

  return { ok: true }
}

/**
 * The roles one account holds, alphabetical — for somebody reading their own
 * access on Settings.
 *
 * Its own read rather than `listStaff()` searched for one row: that lists
 * every account from GoTrue to build a roster, and this needs one person's
 * grants.
 */
export async function rolesForUser(userId: string): Promise<readonly StaffRoleSummary[]> {
  const propertyId = await currentPropertyId()

  const [{ data, error }, roles] = await Promise.all([
    dataClient()
      .from('user_role')
      .select('role_id')
      .eq('property_id', propertyId)
      .eq('user_id', userId),
    listRoles(),
  ])

  if (error) {
    throw new Error(`Could not read roles for user ${userId}: ${error.message}`)
  }

  const heldRoleIds = new Set((data as { role_id: string }[]).map((row) => row.role_id))

  return roles.filter((role) => heldRoleIds.has(role.id))
}

export interface RenameStaffAccountResult {
  /** False when the account already had this name: nothing written, nothing recorded. */
  changed: boolean
}

/**
 * Sets the name an account goes by — in the sidebar, on the staff list, and
 * beside everything the trail says it did.
 *
 * Recorded with both sides, because a name is how the audit log is read: an
 * event saying only "renamed" would leave nobody able to place the person
 * last month's entries were filed under. A rename that changes nothing writes
 * nothing, so an idle save cannot fabricate history (architecture.md §4).
 *
 * The actor is a parameter rather than assumed to be the account itself.
 * Today a staff member names themselves on Settings; the event says who acted
 * either way.
 */
export async function renameStaffAccount(
  userId: string,
  displayName: string,
  actorId: string,
): Promise<RenameStaffAccountResult> {
  const { data, error: readError } = await dataClient().auth.admin.getUserById(userId)

  if (readError || !data.user) {
    throw new Error(`Could not read the account before renaming it: ${readError?.message}`)
  }

  const storedName = data.user.user_metadata?.display_name
  const before = typeof storedName === 'string' ? storedName : ''

  if (before === displayName) {
    return { changed: false }
  }

  // GoTrue merges user_metadata key by key, so this touches the name alone.
  const { error } = await dataClient().auth.admin.updateUserById(userId, {
    user_metadata: { display_name: displayName },
  })

  if (error) {
    throw new Error(`Could not rename the account: ${error.message}`)
  }

  await recordAuditEvent({
    actorId,
    action: 'staff.renamed',
    entityType: 'staff_user',
    entityId: userId,
    before: { display_name: before },
    after: { display_name: displayName },
  })

  return { changed: true }
}

/**
 * Records that somebody chose their own password.
 *
 * Only the record is made here. The change itself happens on the person's own
 * session (`auth.updateUser`, app/(auth)/actions.ts), because GoTrue then keeps
 * that session and ends every other one. The event is what lets the trail read
 * "reset by an administrator, then changed by its owner" instead of stopping
 * at the reset — so whoever handed out the temporary password can see it has
 * stopped working.
 */
export async function recordOwnPasswordChange(userId: string): Promise<void> {
  await recordAuditEvent({
    actorId: userId,
    action: 'staff.password_changed',
    entityType: 'staff_user',
    entityId: userId,
  })
}
