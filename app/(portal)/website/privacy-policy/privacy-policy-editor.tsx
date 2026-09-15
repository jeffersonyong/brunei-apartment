'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'

import { SectionCard } from '@/components/portal/section-card'
import { PrivacyPolicyDocument } from '@/components/privacy-policy-document'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Notice } from '@/components/ui/notice'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast-store'
import {
  checkPrivacyPolicyForPublishing,
  parsePrivacyPolicy,
  tidyPrivacyPolicy,
  unfilledPlaceholders,
} from '@/lib/domain/privacy-policy'

import {
  publishPrivacyPolicyAction,
  savePrivacyPolicyDraftAction,
  type PrivacyPolicyActionState,
} from './actions'
import { PublishPrivacyPolicyDialog } from './publish-privacy-policy-dialog'
import { UseTemplateDialog } from './use-template-dialog'

/** The gaps listed by name; any beyond this are counted. */
const LISTED_GAPS = 6

/**
 * Writing the privacy policy (capability F10).
 *
 * **One text box, and a preview that is the public page's own markup.** The
 * formatting is three conventions a hint under the box states in a sentence,
 * and *Preview* shows what they did — which is how somebody who has never
 * typed `##` can tell it worked.
 *
 * **Save draft** keeps the work and changes nothing on the website; it is
 * dirty-gated (design.md, Buttons). **Publish** is the one primary, asks first,
 * and is disabled while the text is empty, has a `[Fill in: …]` gap, or is
 * already what the website shows. *Start from template* replaces the text in
 * the editor only, and asks first when there is text to lose.
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
  const [text, setText] = useState(savedText)
  const [tab, setTab] = useState('write')
  const [dialog, setDialog] = useState<'publish' | 'template' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const tidied = tidyPrivacyPolicy(text)
  const isDirty = tidied !== tidyPrivacyPolicy(savedText)
  const gaps = unfilledPlaceholders(tidied)
  const isOnWebsite = publishedText !== null && tidied === tidyPrivacyPolicy(publishedText)
  const canPublish = checkPrivacyPolicyForPublishing(tidied).ok && !isOnWebsite

  function submitted(): FormData {
    const data = new FormData()

    data.set('text', text)
    data.set('expectedUpdatedAt', savedAt ?? '')

    return data
  }

  function run(
    action: (
      previous: PrivacyPolicyActionState,
      data: FormData,
    ) => Promise<PrivacyPolicyActionState>,
    onDone: (outcome: PrivacyPolicyActionState) => void,
  ) {
    setError(null)

    startTransition(async () => {
      const outcome = await action({ status: 'idle' }, submitted())

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
    setText(template)
    setTab('write')
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
          onClick={() => (tidied === '' ? applyTemplate() : setDialog('template'))}
        >
          <FileText aria-hidden />
          Start from template
        </Button>
      }
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="write">Write</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="write">
          <Label htmlFor="privacy-policy-text" className="sr-only">
            Privacy policy
          </Label>
          <Textarea
            id="privacy-policy-text"
            value={text}
            disabled={isPending}
            className="min-h-[420px]"
            placeholder="Paste your privacy policy here, or start from the template."
            aria-describedby="privacy-policy-hint"
            onChange={(event) => setText(event.target.value)}
          />
          <p id="privacy-policy-hint" className="mt-sm text-caption text-muted-foreground">
            Start a line with ## for a heading, or with - for a bullet point. Every other line is
            its own paragraph. Preview shows it as the website will.
          </p>
        </TabsContent>

        <TabsContent value="preview">
          <Card surface="inset" className="p-lg">
            {tidied === '' ? (
              <p className="text-body-sm text-muted-foreground">Nothing to preview yet.</p>
            ) : (
              <PrivacyPolicyDocument blocks={parsePrivacyPolicy(tidied)} headingLevel="h3" />
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {tidied === '' ? (
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
                setText(savedText)
                setError(null)
              }}
            >
              Discard changes
            </Button>
          ) : null}
          <Button type="button" variant="tertiary" disabled={isPending || !isDirty} onClick={save}>
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
