import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import {
  heldPermissionGroups,
  PERMISSION_LABELS,
} from '@/app/(portal)/settings/roles/permission-labels'
import { PageHeader } from '@/components/portal/page-header'
import { SectionCard } from '@/components/portal/section-card'
import { Badge } from '@/components/ui/badge'
import { hasPermission, type Permission } from '@/lib/auth/permissions'
import { getActor } from '@/lib/auth/require-permission'
import { getAuthenticatedUser, type AuthenticatedUser } from '@/lib/auth/session'
import { rolesForUser, type StaffRoleSummary } from '@/lib/db/staff'

import { PasswordForm } from './password-form'
import { ProfileForm } from './profile-form'
import { SignOutOtherDevices } from './sign-out-other-devices'

export const metadata: Metadata = {
  title: 'Settings',
}

/**
 * Settings for the person signed in, not for the property.
 *
 * No `capability` ref: this is account housekeeping, which the scope never had
 * to ask for and every role can reach. It is gated on a session alone, and
 * nothing on it can touch another account. Each section answers something staff
 * actually need:
 *
 * - **Profile** — the name the portal and the audit log know you by. The email
 *   is shown and not offered: it is the sign-in, and no auth email exists to
 *   confirm a new one (architecture.md §3).
 * - **Password** — replacing the temporary one an administrator handed over.
 *   The administrator keeps the reset, in Roles & staff.
 * - **Signed-in devices** — ending every session but this one.
 * - **Your access** — the roles you hold and what they let you do, read-only,
 *   so "why can't I open that?" has an answer on screen and a person to ask.
 *
 * Notification preferences, pencilled in when this was a placeholder, are not
 * here: the product sends staff nothing to have a preference about.
 *
 * Addressed `/account`, not `/settings` where the placeholder
 * sat: the admin screens live beneath that prefix, and a person's own account
 * is not their parent.
 */
export default async function AccountSettingsPage() {
  const user = await getAuthenticatedUser()

  // proxy.ts guarantees a session behind the portal; null here is a sign-out
  // in another tab mid-render.
  if (!user) {
    redirect('/login')
  }

  const [actor, roles] = await Promise.all([getActor(), rolesForUser(user.id)])
  const permissions: ReadonlySet<Permission> = actor?.permissions ?? new Set()

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your own account: the name you go by, your password, and what you have access to."
      />

      {/* Two columns on a wide panel — the three things you change on the
          left, the one you only read on the right, where its length cannot
          push the forms below the fold. One column below `lg`, in the same
          order. */}
      <div className="mt-lg grid gap-lg lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <div className="grid gap-lg">
          <SectionCard id="profile-heading" title="Profile">
            <ProfileForm name={storedName(user)} email={user.email} />
          </SectionCard>

          <SectionCard id="password-heading" title="Password">
            <PasswordForm email={user.email} />
          </SectionCard>

          <SectionCard id="devices-heading" title="Signed-in devices">
            <SignOutOtherDevices />
          </SectionCard>
        </div>

        <SectionCard id="access-heading" title="Your access">
          <AccessSummary roles={roles} permissions={permissions} />
        </SectionCard>
      </div>
    </>
  )
}

/**
 * The name as stored. `getAuthenticatedUser` stands the email in for an
 * account created without a name — right for the sidebar, wrong for a field
 * that would then offer to save the email as somebody's name.
 */
function storedName(user: AuthenticatedUser): string {
  return user.displayName === user.email ? '' : user.displayName
}

/**
 * What the person's roles let them do, in the roles matrix's own groups and
 * words. Read-only on purpose: access is granted by whoever holds
 * `config.manage`, and the one who does gets a link to where that happens.
 */
function AccessSummary({
  roles,
  permissions,
}: {
  roles: readonly StaffRoleSummary[]
  permissions: ReadonlySet<Permission>
}) {
  const groups = heldPermissionGroups(permissions)

  return (
    <div className="grid gap-lg">
      <div className="grid gap-sm">
        <p className="text-body-sm-strong text-foreground">Roles</p>
        {roles.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">
            You don&rsquo;t hold a role yet, so there is little in the portal you can open.
          </p>
        ) : (
          <span className="flex flex-wrap gap-xs">
            {roles.map((role) => (
              <Badge key={role.id}>{role.name}</Badge>
            ))}
          </span>
        )}
      </div>

      {groups.length > 0 ? (
        <div className="grid gap-lg sm:grid-cols-2">
          {groups.map((group) => (
            <div key={group.label} className="grid content-start gap-xs">
              <h3 className="micro-label text-muted-foreground">{group.label}</h3>
              <ul className="grid gap-xxs text-body-sm text-foreground">
                {group.permissions.map((permission) => (
                  <li key={permission}>{PERMISSION_LABELS[permission]}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      <p className="border-t border-divider pt-md text-body-sm text-muted-foreground">
        {hasPermission(permissions, 'config.manage') ? (
          <>
            Roles are given and changed in{' '}
            <Link
              href="/settings/roles"
              className="rounded-sm text-foreground underline decoration-muted-foreground underline-offset-2 transition-colors outline-none hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              Roles &amp; staff
            </Link>
            .
          </>
        ) : (
          'Roles are given by an administrator. If something you need for your job is missing, ask them.'
        )}
      </p>
    </div>
  )
}
