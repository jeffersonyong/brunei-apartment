'use client'

import { Check } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Callout } from '@/components/ui/callout'
import { TextActionLabel } from '@/components/ui/text-action'
import {
  acceptAttributeFor,
  formatByteSize,
  MAX_DOCUMENT_BYTES,
  oversizedFiles,
  type CustomerAttachableKind,
} from '@/lib/domain/document'
import type { SlipBoxKey } from '@/lib/domain/slip-boxes'

import { uploadDocumentAction, type UploadState } from './actions'

/**
 * The guest sends us a file (capabilities A6 and A7).
 *
 * One component for both, because from the customer's side they are the same
 * act — choose a photograph, and it is with us. The only thing that differs is
 * what the surrounding sentence asks for. A6 is the transfer slip they would
 * otherwise send over WhatsApp; A7 is the IC the desk would otherwise ask for
 * at the door.
 *
 * ── Choosing the file sends it, and there is no Send ───────────────────────
 *
 * There used to be one, and it was a trap. Two of these sit on the page, so a
 * guest picks an IC, picks a slip below it, sees both filenames on screen and
 * reasonably concludes both have arrived — the second pick looks like the
 * confirmation of the first. Nothing on the page contradicts them until they
 * get to the desk and are asked for an IC they believe they sent.
 *
 * That failure is silent, and it is expensive in exactly the way A7 exists to
 * avoid: an upload nobody completes is an upload the desk chases anyway.
 *
 * So the picker submits. Three things make that safe here, and they would not
 * all hold elsewhere:
 *
 *   - **Nothing is destroyed.** A second file supersedes the guest's own first
 *     one, so a mis-tap costs one more tap rather than a lost record.
 *   - **There is nothing to review.** The file is a photograph of a document;
 *     holding it back for a confirmation step buys the guest no decision they
 *     could not make by looking at their own camera roll.
 *   - **It is not a claim.** "I have made the transfer" keeps its button,
 *     because pressing that asserts something about the world and puts a row
 *     in front of a clerk. Attaching a photograph asserts nothing.
 *
 * The size check still runs before anything is sent, so an oversized file is
 * refused where it is chosen rather than after a round trip.
 *
 * ── What it shows once a file is on file ───────────────────────────────────
 *
 * That there is one, and when it arrived. Never the filename, and never a way
 * to open it — this link travels in forwarded WhatsApp messages, and
 * `lib/domain/document.ts` carries the argument at length. A guest who sends a
 * second file replaces their own; the copy says so, because otherwise "choose a
 * different file" reads as though we will end up with two.
 *
 * **It reads as done** (Jeff, 9 October 2026). A held file used to keep the
 * bordered button, now saying "Choose a different file", with the tick small
 * beside it — so the loudest thing in the section was an invitation to do it
 * again, and a guest whose IC came with the booking form could reasonably
 * wonder whether they still had to. Now the status sits beside the heading as
 * a positive badge, where it is read first, and the picker steps down to a
 * text action: still there for an unreadable photo, no longer asking.
 *
 * ── What the line under the picker promises ───────────────────────────────
 *
 * Two things, and deliberately no third. That the file is held privately, and
 * that it is used internally to verify the booking — which is the answer to
 * the question a guest is actually asking as they hand over an IC.
 *
 * It names no retention period, because prd.md §13 makes that configuration
 * edited on Property settings (F3), and copy carrying a number is a second
 * copy of that setting in the one place nobody will think to update. It no
 * longer promises deletion either (Jeff, 17 September 2026): the privacy
 * policy is where the handling of personal data is stated in full, and it is
 * linked from right here. A retention promise made twice, in a sentence under
 * a file picker and again in the policy, is one that can drift.
 */
interface SendAFileProps {
  token: string
  kind: CustomerAttachableKind
  /**
   * Which of the uploads this is — "A", "B", and "C" when the guest has sent
   * the rest of the stay as a transfer of its own.
   *
   * Lettered, because two upload sections look alike and a guest who has done
   * one has no way to tell whether the other is the same thing again or a
   * second job. What it must not do is compete with the numbered list at the
   * top of the page: that list is the flow — make the transfer, then send us
   * your IC — and the letters are the two boxes inside the second half of it.
   * Two numbered systems on one screen would disagree about what step two is;
   * a letter beside a number cannot be mistaken for one.
   */
  marker: string
  /** The heading. */
  title: string
  /** Why we are asking, in the guest's terms. */
  description: string
  /** When this kind is already on file, the instant it arrived. */
  onFileSince: string | null
  /**
   * For a slip, which transfer it is evidence of (lib/domain/slip-boxes.ts):
   * the first one, or the rest of the stay sent later. Each has a box of its
   * own, so a slip for one never replaces the other's.
   */
  target?: SlipBoxKey
  /**
   * Points the guest at the privacy policy beside the promise about their file
   * (capability F10). Given for the IC only — the one upload that is identity
   * data handed over with no member of staff present — and only once a policy
   * is published, so it never links to a page that is not there.
   */
  linksPrivacyPolicy?: boolean
}

export function SendAFile({
  token,
  kind,
  marker,
  title,
  description,
  onFileSince,
  target,
  linksPrivacyPolicy = false,
}: SendAFileProps) {
  const [state, action, pending] = useActionState<UploadState, FormData>(uploadDocumentAction, {
    status: 'idle',
  })
  const [refused, setRefused] = useState<File | null>(null)
  const [seen, setSeen] = useState(state)
  const formRef = useRef<HTMLFormElement>(null)
  // One per box: a page can carry two slip boxes, and a label pointing at the
  // other box's input would send the file to the wrong transfer.
  const inputId = target ? `send-${kind}-${target}` : `send-${kind}`

  // A completed send forgets the file that was refused before it, so the
  // section returns to its resting state. React 19 resets the `<input>` itself
  // once a form action settles, so this is only what we remembered about it.
  //
  // Adjusted during render rather than in an effect — the pattern React
  // documents for state that depends on something changing, and the reason is
  // the ordinary one: an effect would render the stale line once, then render
  // again without it.
  if (seen !== state) {
    setSeen(state)
    setRefused(null)
  }

  /**
   * Picking the file is the whole interaction.
   *
   * The size guard runs first and stops the submit, because an oversized file
   * refused here costs nothing while one refused by the server costs a round
   * trip on a phone signal this product is explicitly built for (prd.md §15).
   */
  function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const [chosen] = Array.from(event.target.files ?? [])

    if (!chosen) {
      return
    }

    if (oversizedFiles([chosen]).length > 0) {
      setRefused(chosen)

      return
    }

    setRefused(null)
    formRef.current?.requestSubmit()
  }

  const held = state.status === 'done' || onFileSince !== null

  return (
    <section className="mt-xl border-t border-border pt-xl">
      <div className="flex flex-wrap items-center gap-x-sm gap-y-xs">
        <h2 className="text-body-lg-strong text-foreground">
          <span className="text-muted-foreground">{marker}.</span> {title}
        </h2>
        {held ? (
          <Badge tone="positive">
            <Check aria-hidden className="size-3" />
            {onFileSince ? `Received ${formatArrival(onFileSince)}` : 'Received'}
          </Badge>
        ) : null}
      </div>
      <p className="text-body mt-xs text-copy">{description}</p>

      <form ref={formRef} action={action} className="mt-md grid gap-md">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="kind" value={kind} />
        {target ? <input type="hidden" name="target" value={target} /> : null}

        <div className="flex flex-wrap items-center gap-md">
          {/* Before the label, so the label can show the input's focus and its
              disabled state while a file is sending: the input is the thing
              focused and disabled, and `peer` only looks backwards. */}
          <input
            id={inputId}
            type="file"
            name="file"
            accept={acceptAttributeFor(kind)}
            disabled={pending}
            className="peer sr-only"
            onChange={handlePick}
          />
          {held ? (
            <TextActionLabel
              htmlFor={inputId}
              className="h-control peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:pointer-events-none peer-disabled:opacity-50"
            >
              Choose a different file
            </TextActionLabel>
          ) : (
            <label
              htmlFor={inputId}
              className="inline-flex h-control cursor-pointer items-center gap-sm rounded-md border border-border bg-card px-lg text-button-md text-foreground transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:pointer-events-none peer-disabled:opacity-50 hover:bg-muted"
            >
              Choose a file
            </label>
          )}

          {/* Said out loud as it changes, because the thing that changes is
              whether we have their document and they are no longer pressing a
              button to find out. The badge beside the heading is the standing
              answer; this is the acknowledgement of the file just sent. */}
          <p aria-live="polite" className="text-body-sm text-copy">
            {pending ? 'Sending…' : state.status === 'done' ? 'Received, thank you.' : ''}
          </p>
        </div>

        {refused ? (
          <p className="text-body-sm text-destructive">
            {refused.name} is {formatByteSize(refused.size)}, which is larger than {megabytes()} MB.
            A photograph taken on a phone is usually well under it.
          </p>
        ) : (
          <p className="text-caption text-muted-foreground">
            JPEG, PNG, WebP or PDF, up to {megabytes()} MB. Held privately, used only internally for
            verification.
            {held ? ' Sending another replaces the one we have.' : ''}
            {linksPrivacyPolicy ? (
              <>
                {' '}
                {/* A new tab: the guest is part-way through sending a file, and
                    reading the policy should not lose their place. */}
                <Link href="/privacy" target="_blank" rel="noopener" className="underline">
                  How we handle your personal data
                </Link>
                .
              </>
            ) : null}
          </p>
        )}

        {state.status === 'error' ? (
          <Callout tone="negative" placement="nested">
            {state.message}
          </Callout>
        ) : null}
      </form>
    </section>
  )
}

function megabytes(): number {
  return Math.round(MAX_DOCUMENT_BYTES / (1024 * 1024))
}

/**
 * When a file arrived, in the register a guest reads rather than the portal's.
 *
 * A date and no time: "we have it" is the whole of what this tells them, and a
 * timestamp to the minute invites a question about which of two uploads it was.
 */
function formatArrival(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
