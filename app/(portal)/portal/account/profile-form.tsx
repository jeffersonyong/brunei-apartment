'use client'

import { useActionState, useEffect, useState } from 'react'

import { TextField } from '@/components/portal/form-fields'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast-store'

import { renameSelfAction, type RenameSelfState } from './actions'

/**
 * The name you go by, and the email you sign in with.
 *
 * The name is yours to change. The email is shown rather than offered: it is
 * the sign-in itself, and no auth email exists to confirm a new address
 * (architecture.md §3).
 *
 * Save is dirty-gated (design.md §Components), so an idle click records
 * nothing. After a save the page re-renders with the stored name, which the
 * draft already matches, so the button settles back to disabled on its own.
 */

const initialState: RenameSelfState = { status: 'idle' }

interface ProfileFormProps {
  /** The stored name — empty for an account created without one. */
  name: string
  email: string
}

export function ProfileForm({ name, email }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(renameSelfAction, initialState)
  const [draft, setDraft] = useState(name)
  const isDirty = draft.trim() !== name

  // Keyed on the state object, so a second rename in one visit toasts again.
  useEffect(() => {
    if (state.status === 'done') {
      toast({
        tone: 'positive',
        title: 'Name saved',
        description: 'Everything you have done in the portal now shows under it.',
      })
    }
  }, [state])

  return (
    <form action={formAction} className="grid gap-lg">
      <TextField
        id="displayName"
        label="Name"
        placeholder="Jane Doe"
        autoComplete="name"
        value={draft}
        onChange={setDraft}
        error={state.fieldErrors?.displayName}
        className="max-w-[360px]"
      />

      <div className="grid gap-sm">
        <p className="text-body-sm-strong text-foreground">Email</p>
        <p className="text-body-md text-foreground">{email}</p>
        <p className="text-caption text-muted-foreground">
          You sign in with this, so it can&rsquo;t be changed here.
        </p>
      </div>

      <Button type="submit" disabled={!isDirty || isPending} className="justify-self-start">
        {isPending ? 'Saving…' : 'Save name'}
      </Button>
    </form>
  )
}
