'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { LogOut, Settings } from 'lucide-react'

import { signOutAction } from '@/app/(auth)/actions'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { initials } from '@/components/ui/avatar-identity'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * Who is signed in — the account menu at the foot of the sidebar (and in the
 * mobile drawer). The trigger is the identity row itself; the menu holds what
 * belongs to the person rather than any screen: their own Settings, and
 * leaving.
 *
 * Settings is a link, where changing the password used to open a dialog from
 * here. The password now lives on that screen beside the name it belongs with,
 * and one copy of the form is the one that stays right. Inside the mobile
 * drawer the link closes the drawer like every other: React events bubble
 * through the menu's portal to the drawer's click delegation.
 */

export interface PortalAccountUser {
  /** The account id — the avatar's seed, so this chip and the staff table
      agree on the signed-in user's colour. */
  id: string
  name: string
  email: string
}

export function PortalAccount({ user }: { user: PortalAccountUser }) {
  // Signing out is a round trip and a redirect. The menu stays open on the
  // item, which says so, instead of closing onto a screen that looks as though
  // nothing was pressed.
  const [isSigningOut, startSignOut] = useTransition()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-sm rounded-md px-sm py-sm text-left transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=open]:bg-muted">
        <Avatar>
          <AvatarFallback seed={user.id}>{initials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-body-sm text-foreground">{user.name}</p>
          <p className="truncate text-caption text-muted-foreground">{user.email}</p>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="top" align="start" className="w-[200px]">
        <DropdownMenuLabel>Signed in</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/account">
            <Settings aria-hidden />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault()
            startSignOut(() => signOutAction())
          }}
        >
          <LogOut aria-hidden />
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
