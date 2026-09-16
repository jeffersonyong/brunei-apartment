'use client'

import { useEffect, useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { toast } from '@/components/ui/toast-store'
import { isSettingsDraftDirty, type SettingsProblem } from '@/lib/domain/settings-checks'

import type { SettingsActionState } from './actions'

/**
 * The shell every settings tab is saved through (capability F3).
 *
 * One card, one Save, one server action — and the four things each tab would
 * otherwise repeat: the dirty gate, the hidden draft and token, the refusal
 * panel, and the toast on success.
 *
 * **Save is dirty-gated** (design.md §Components): disabled until the draft
 * actually differs from what is stored, so an idle click cannot fire a no-op
 * write or its audit event. The server diffs again and writes nothing when a
 * save changes nothing, so the gate is a courtesy rather than the guarantee —
 * but it is the difference between a trail of real changes and a trail of
 * people opening a screen.
 *
 * **The new concurrency token arrives with the save's own response.** The token
 * moves when a save changes something, and every tab holds the same one; a tab
 * still holding the old value would be refused on its next save with "somebody
 * else changed these settings", when that somebody was this screen. Every
 * action revalidates this screen, so its response re-renders the page and the
 * token reaches each tab as a fresh `expectedUpdatedAt` prop — no client
 * refresh is needed, and one would only render the page a second time.
 */

interface SettingsFormProps<T> {
  action: (state: SettingsActionState, formData: FormData) => Promise<SettingsActionState>
  /** What is on screen now. */
  draft: T
  /** What is stored — the same shape, straight from the server. */
  saved: T
  expectedUpdatedAt: string
  /** The toast title on a save that changed something. */
  savedTitle: string
  children: (form: {
    problemFor: (field: string) => string | undefined
    isPending: boolean
  }) => React.ReactNode
}

const initialState: SettingsActionState = { status: 'idle' }

export function SettingsForm<T>({
  action,
  draft,
  saved,
  expectedUpdatedAt,
  savedTitle,
  children,
}: SettingsFormProps<T>) {
  const [state, formAction, isPending] = useActionState(action, initialState)
  const isDirty = isSettingsDraftDirty(draft, saved)

  useEffect(() => {
    if (state.status !== 'done') {
      return
    }

    toast({
      tone: 'positive',
      title: savedTitle,
      description:
        state.changed === 0
          ? 'Nothing had changed, so nothing was recorded.'
          : `${state.changed} ${state.changed === 1 ? 'change' : 'changes'} saved and recorded.`,
    })
  }, [state, savedTitle])

  const problems = state.status === 'error' ? (state.problems ?? []) : []

  return (
    <form action={formAction} className="grid gap-xl">
      <input type="hidden" name="draft" value={JSON.stringify(draft)} />
      <input type="hidden" name="expectedUpdatedAt" value={expectedUpdatedAt} />

      {children({ problemFor: problemLookup(problems), isPending })}

      {state.status === 'error' && state.message ? (
        <Callout tone="negative" role="alert">
          {state.message}
        </Callout>
      ) : null}

      <div className="flex items-center gap-md border-t border-divider pt-lg">
        <Button type="submit" disabled={!isDirty || isPending}>
          {isPending ? 'Saving…' : 'Save changes'}
        </Button>

        <p className="text-caption text-muted-foreground">
          {isDirty ? 'Unsaved changes.' : 'Everything here is saved.'}
        </p>
      </div>
    </form>
  )
}

function problemLookup(
  problems: readonly SettingsProblem[],
): (field: string) => string | undefined {
  const byField = new Map(problems.map((problem) => [problem.field, problem.message]))

  return (field) => byField.get(field)
}
