'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'

import { SectionCard } from '@/components/portal/section-card'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { Notice } from '@/components/ui/notice'
import { toast } from '@/components/ui/toast-store'
import {
  MAX_PRIVACY_POLICY_LENGTH,
  normalisePrivacyPolicy,
  unfilledPlaceholders,
} from '@/lib/domain/privacy-policy'

import {
  publishPrivacyPolicyAction,
  savePrivacyPolicyDraftAction,
  type PrivacyPolicyActionState,
} from './actions'
import { PolicyRichText } from './policy-rich-text'
import { PublishPrivacyPolicyDialog } from './publish-privacy-policy-dialog'
import { UseTemplateDialog } from './use-template-dialog'

/** The gaps listed by name; any beyond this are counted. */
const LISTED_GAPS = 6

/**
 * Writing the privacy policy (capability F10).
 *
 * **A rich text editor, saving plain text.** The editor (`PolicyRichText`)
 * looks like the page a guest reads, and hands back the stored format — so
 * everything here compares and saves text, normalised the way the editor
 * writes it, and nothing downstream knows an editor exists.
 *
 * **Save draft** keeps the work and changes nothing on the website; it is
 * dirty-gated (design.md, Buttons). **Publish** is the one primary, asks first,
 * and is disabled while the text is empty, too long, has a `[Fill in: …]` gap,
 * or is already what the website shows. *Start from template* replaces what is
 * in the editor only, and asks first when there is text to lose.
 */
export function PrivacyPolicyEditor({
  savedText,
  savedAt,
  publishedText,
  template,
}: {
  savedText: string
  /** The saved draft's `updated_at`, sent back so a concurrent save is refused. */
  savedAt: string | null
  publishedText: string | null
  template: string
}) {
  const saved = useMemo(() => normalisePrivacyPolicy(savedText), [savedText])
  const published = useMemo(
    () => (publishedText === null ? null : normalisePrivacyPolicy(publishedText)),
    [publishedText],
  )
  const templateText = useMemo(() => normalisePrivacyPolicy(template), [template])

  const [text, setText] = useState(saved)
  const [dialog, setDialog] = useState<'publish' | 'template' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const isDirty = text !== saved
  const gaps = unfilledPlaceholders(text)
  const isTooLong = text.length > MAX_PRIVACY_POLICY_LENGTH
  const isOnWebsite = published !== null && text === published
  const canPublish = text !== '' && !isTooLong && gaps.length === 0 && !isOnWebsite

  function run(
    action: (
      previous: PrivacyPolicyActionState,
      data: FormData,
    ) => Promise<PrivacyPolicyActionState>,
    onDone: (outcome: PrivacyPolicyActionState) => void,
  ) {
    setError(null)

    startTransition(async () => {
      const data = new FormData()

      data.set('text', text)
      data.set('expectedUpdatedAt', savedAt ?? '')

      const outcome = await action({ status: 'idle' }, data)

      if (outcome.status !== 'done') {
        setError(outcome.message ?? 'The privacy policy could not be saved. Try again.')
        return
      }

      onDone(outcome)
      router.refresh()
    })
  }

  function save() {
    run(savePrivacyPolicyDraftAction, () => toast({ tone: 'positive', title: 'Draft saved' }))
  }

  function publish() {
    run(publishPrivacyPolicyAction, (outcome) => {
      setDialog(null)
      toast({
        tone: 'positive',
        title: outcome.changed ? 'Privacy policy published' : 'The website already shows this',
      })
    })
  }

  function applyTemplate() {
    setText(templateText)
    setDialog(null)
  }

  return (
    <SectionCard
      id="privacy-policy-editor"
      title="The policy"
      actions={
        <Button
          type="button"
          variant="tertiary"
          disabled={isPending}
          onClick={() => (text === '' ? applyTemplate() : setDialog('template'))}
        >
          <FileText aria-hidden />
          Start from template
        </Button>
      }
    >
      <PolicyRichText
        value={text}
        onChange={setText}
        disabled={isPending}
        labelledBy="privacy-policy-editor"
        describedBy="privacy-policy-hint"
      />
      <p id="privacy-policy-hint" className="mt-sm text-caption text-muted-foreground">
        Paste from Word or Google Docs and its headings, lists and bold come with it; other
        formatting is left behind.
      </p>

      {text === '' ? (
        <Notice className="mt-md">
          Nothing written yet. <strong className="font-medium">Start from template</strong> gives
          you headings shaped to what the website collects, with a [Fill in: …] gap wherever only
          you know the answer. The wording is yours to approve before you publish it.
        </Notice>
      ) : null}

      {gaps.length > 0 ? (
        <Notice className="mt-md">
          <p>
            {gaps.length === 1
              ? 'One gap to fill before you can publish:'
              : `${gaps.length} gaps to fill before you can publish:`}
          </p>
          <ul className="mt-xs list-disc pl-lg">
            {gaps.slice(0, LISTED_GAPS).map((gap, index) => (
              <li key={index}>{gap || 'a gap with nothing in it'}</li>
            ))}
          </ul>
          {gaps.length > LISTED_GAPS ? (
            <p className="mt-xs">…and {gaps.length - LISTED_GAPS} more.</p>
          ) : null}
        </Notice>
      ) : null}

      {isTooLong ? (
        <Callout className="mt-md">
          The policy is longer than {MAX_PRIVACY_POLICY_LENGTH.toLocaleString('en-GB')} characters,
          so it cannot be saved. Shorten it first.
        </Callout>
      ) : null}

      {error && dialog === null ? (
        <Callout role="alert" className="mt-md">
          {error}
        </Callout>
      ) : null}

      <div className="mt-lg flex flex-wrap items-center justify-between gap-md border-t border-divider pt-lg">
        <p aria-live="polite" className="text-body-sm text-muted-foreground">
          {editorState({ isDirty, isOnWebsite, isSaved: savedAt !== null })}
        </p>
        <div className="flex flex-wrap items-center gap-sm">
          {isDirty ? (
            <Button
              type="button"
              variant="tertiary"
              disabled={isPending}
              onClick={() => {
                setText(saved)
                setError(null)
              }}
            >
              Discard changes
            </Button>
          ) : null}
          <Button
            type="button"
            variant="tertiary"
            disabled={isPending || !isDirty || isTooLong}
            onClick={save}
          >
            {isPending && dialog === null ? 'Saving…' : 'Save draft'}
          </Button>
          <Button
            type="button"
            disabled={isPending || !canPublish}
            onClick={() => {
              setError(null)
              setDialog('publish')
            }}
          >
            Publish
          </Button>
        </div>
      </div>

      {dialog === 'publish' ? (
        <PublishPrivacyPolicyDialog
          isFirst={publishedText === null}
          isPending={isPending}
          error={error}
          onPublish={publish}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {dialog === 'template' ? (
        <UseTemplateDialog onUseTemplate={applyTemplate} onClose={() => setDialog(null)} />
      ) : null}
    </SectionCard>
  )
}

function editorState(input: { isDirty: boolean; isOnWebsite: boolean; isSaved: boolean }): string {
  if (input.isDirty) {
    return 'Unsaved changes'
  }

  if (input.isOnWebsite) {
    return 'This is what the website shows'
  }

  return input.isSaved ? 'Draft saved — not on the website yet' : ''
}
