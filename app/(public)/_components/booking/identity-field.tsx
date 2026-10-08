'use client'

import { Check } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { preparePhoto } from '@/components/prepare-photo'
import { FieldError } from '@/components/ui/field-error'
import { acceptAttributeFor, formatByteSize, MAX_DOCUMENT_BYTES } from '@/lib/domain/document'
import { MAX_PHOTO_ORIGINAL_BYTES } from '@/lib/domain/image-size'

/**
 * The lead guest's IC or passport, on the public booking forms (capability A7,
 * Jason's team, 8 October 2026; open-questions.md N62).
 *
 * Compulsory: the booking is not made without it, and the form's submit stays
 * disabled until a file is chosen. The front of an IC or of a passport — one
 * file, a photograph or a PDF.
 *
 * ── Made smaller here, before it is sent ──────────────────────────────────
 *
 * A phone camera's photograph is often larger than the 4 MB a document may be,
 * and a refusal here would now cost the booking, not just the upload. So a
 * photograph is shrunk on the phone first (components/prepare-photo.ts, which
 * the inspection camera already uses) — which also drops its location and
 * camera details. A PDF is sent as it is, and refused here if it is too large.
 *
 * ── Kept through a refusal ────────────────────────────────────────────────
 *
 * The prepared file lives in the parent's state, not in the input. React 19
 * resets a form after its action returns, and a file input cannot be filled
 * back in — so a guest whose dates had just been taken would otherwise have to
 * find the photograph again. The input itself has no `name`; the parent adds
 * the file to the form data on submit.
 */

interface IdentityFieldProps {
  /** The file that will be sent, already prepared, or null. */
  file: File | null
  onChange: (file: File | null) => void
  /** What the server said about the file, if it refused it. */
  error?: string
  /**
   * The submission `error` came from — the form's action state. Picking a new
   * file hides an error that was about the old one, until the next attempt.
   */
  attempt: unknown
  /** Links the privacy policy beside the promise, once one is published. */
  linksPrivacyPolicy: boolean
}

const INPUT_ID = 'identity'

export function IdentityField({
  file,
  onChange,
  error,
  attempt,
  linksPrivacyPolicy,
}: IdentityFieldProps) {
  const [preparing, setPreparing] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [answeredAttempt, setAnsweredAttempt] = useState<unknown>(null)

  async function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const [chosen] = Array.from(event.target.files ?? [])

    // Picking the same file twice should still be noticed.
    event.target.value = ''

    if (!chosen) {
      return
    }

    setLocalError(null)
    setAnsweredAttempt(attempt)

    if (chosen.type === 'application/pdf') {
      if (chosen.size > MAX_DOCUMENT_BYTES) {
        setLocalError(
          `${chosen.name} is ${formatByteSize(chosen.size)}, which is larger than 4 MB. Send a photograph of the front instead, or a smaller PDF.`,
        )
        return
      }

      onChange(chosen)
      return
    }

    if (chosen.size > MAX_PHOTO_ORIGINAL_BYTES) {
      setLocalError(`${chosen.name} is too large to open on a phone. Choose a smaller photo.`)
      return
    }

    setPreparing(true)

    try {
      const prepared = await preparePhoto(chosen, { maxBytes: MAX_DOCUMENT_BYTES })

      if (!prepared.ok) {
        setLocalError(prepared.message)
        return
      }

      onChange(prepared.photo.file)
    } finally {
      setPreparing(false)
    }
  }

  const shown = localError ?? (answeredAttempt === attempt ? undefined : error)
  const errorId = shown ? `${INPUT_ID}-error` : undefined

  return (
    <div className="flex flex-col gap-xs">
      <p className="text-body-sm-strong text-foreground">IC or passport</p>
      <p id={`${INPUT_ID}-hint`} className="text-caption text-muted-foreground">
        A photo or PDF of the front of the lead guest&rsquo;s IC or passport. We need it to register
        your booking.
      </p>

      <div className="mt-xs flex flex-wrap items-center gap-md">
        <label
          htmlFor={INPUT_ID}
          className="inline-flex h-control cursor-pointer items-center gap-sm rounded-md border border-border bg-card px-lg text-button-md text-foreground transition-colors focus-within:ring-2 focus-within:ring-ring hover:bg-muted"
        >
          {file ? 'Choose a different file' : 'Choose a file'}
        </label>
        <input
          id={INPUT_ID}
          type="file"
          accept={acceptAttributeFor('identity')}
          disabled={preparing}
          className="sr-only"
          aria-invalid={shown ? true : undefined}
          aria-describedby={[`${INPUT_ID}-hint`, errorId].filter(Boolean).join(' ')}
          onChange={handlePick}
        />

        <p aria-live="polite" className="min-w-0 text-body-sm break-words text-copy">
          {preparing ? (
            'Getting it ready…'
          ) : file ? (
            <span className="inline-flex items-center gap-xs">
              <Check aria-hidden className="size-4 shrink-0 text-positive-deep" />
              {file.name} · {formatByteSize(file.size)}
            </span>
          ) : null}
        </p>
      </div>

      <FieldError id={errorId} message={shown ?? undefined} />

      <p className="text-caption text-muted-foreground">
        JPEG, PNG, WebP or PDF. Kept privately and used only to register your booking.
        {linksPrivacyPolicy ? (
          <>
            {' '}
            {/* A new tab: the guest is part-way through a form, and reading
                the policy should not lose what they have filled in. */}
            <Link href="/privacy" target="_blank" rel="noopener" className="underline">
              How we handle your personal data
            </Link>
            .
          </>
        ) : null}
      </p>
    </div>
  )
}
