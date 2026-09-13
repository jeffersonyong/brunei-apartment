'use client'

import { useState } from 'react'

import type { ChangePasswordState } from '@/app/(auth)/actions'
import { FieldError } from '@/components/ui/field-error'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password-policy'

/**
 * "New password" and "Repeat it", for the two forms that set a password on the
 * signed-in account: Settings, and the page an emailed reset link opens. Both
 * submit to `changeOwnPasswordAction`, and pass its state in here.
 *
 * **Controlled, on purpose.** React resets a form's uncontrolled fields
 * whenever its action settles, refused or not, so a mismatch would clear both
 * while the error beside them asks for a correction. They are emptied only once
 * a password has actually been set — during render, when a new result arrives,
 * which is React's pattern for state that follows a prop and keeps a render
 * from painting the old values first.
 *
 * The caller's form carries the hidden username field password managers need,
 * since only it knows the account.
 */
export function NewPasswordFields({ state }: { state: ChangePasswordState }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [handledState, setHandledState] = useState(state)

  // Keyed on the state object, not its status: a second change in the same
  // visit produces a new 'updated' object and must clear again.
  if (state !== handledState) {
    setHandledState(state)

    if (state.status === 'updated') {
      setPassword('')
      setConfirm('')
    }
  }

  return (
    <>
      <div className="grid max-w-[360px] gap-sm">
        <Label htmlFor="new-password">New password</Label>
        <PasswordInput
          id="new-password"
          name="password"
          autoComplete="new-password"
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={state.fieldErrors?.password ? true : undefined}
        />
        <FieldError message={state.fieldErrors?.password} />
      </div>

      <div className="grid max-w-[360px] gap-sm">
        <Label htmlFor="confirm-password">Repeat it</Label>
        <PasswordInput
          id="confirm-password"
          name="confirm"
          autoComplete="new-password"
          placeholder="Type it again"
          required
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          aria-invalid={state.fieldErrors?.confirm ? true : undefined}
        />
        <FieldError message={state.fieldErrors?.confirm} />
      </div>
    </>
  )
}
