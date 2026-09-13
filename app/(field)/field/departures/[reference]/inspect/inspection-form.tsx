'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'

import { attachDocumentAction } from '@/app/(portal)/portal/documents/actions'
import { DID_NOT_GO_THROUGH } from '@/components/field/did-not-go-through'
import { PhotoPicker, type ChosenPhoto } from '@/components/field/photo-picker'
import { preparePhoto } from '@/components/prepare-photo'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field-error'
import { Label } from '@/components/ui/label'
import { Notice } from '@/components/ui/notice'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast-store'
import { MAX_DOCUMENT_BYTES } from '@/lib/domain/document'
import {
  checkInspectionNotes,
  INSPECTION_OUTCOME_LABELS,
  INSPECTION_OUTCOMES,
  MAX_INSPECTION_NOTES_LENGTH,
  type InspectionOutcome,
} from '@/lib/domain/inspection'
import { cn } from '@/lib/utils'

import { recordFieldInspectionAction, type TurnoverActionState } from '../../actions'

/**
 * The inspection, on a phone (capability C2).
 *
 * The same sequence as the portal's dialog (deposits/[reference]/record-
 * inspection.tsx), for the same reason: a photograph hangs off an inspection,
 * so the inspection is written first and the photographs go up against it, one
 * request each. What differs is the phone:
 *
 * - **Two large choices** for how the unit was found, not a select — a thumb,
 *   not a pointer, and the answer the release turns on should be one tap that
 *   can be seen from arm's length.
 * - **Each photograph is shrunk just before it is sent**, one at a time, so a
 *   mid-range phone holds one decoded camera original in memory rather than
 *   five (components/prepare-photo.ts).
 * - **Each photograph shows its own progress**, and one that fails stays on
 *   the list to send again. The inspection is never rewritten: once it lands
 *   the outcome and notes freeze, and what is left is photographs.
 * - **No signal is a sentence.** A write that never reached the server says
 *   nothing was recorded, rather than an error page in the middle of a unit.
 */

interface InspectionFormProps {
  bookingId: string
  reference: string
  unitRef: string
  /** Set when the stay is already inspected: the form is then photographs only. */
  existing: { id: string; outcome: InspectionOutcome; notes: string | null } | null
}

interface Refusal {
  message?: string
  fieldErrors?: Record<string, string>
}

type SendOutcome = { ok: true } | { ok: false; message: string }

export function InspectionForm({ bookingId, reference, unitRef, existing }: InspectionFormProps) {
  const [outcome, setOutcome] = useState<InspectionOutcome | null>(existing?.outcome ?? null)
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [photos, setPhotos] = useState<readonly ChosenPhoto[]>([])
  const [inspectionId, setInspectionId] = useState<string | null>(existing?.id ?? null)
  const [refusal, setRefusal] = useState<Refusal | null>(null)
  const [step, setStep] = useState<'idle' | 'recording' | 'sending'>('idle')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const isRecorded = inspectionId !== null
  const needsNotes = outcome === 'issues_found'
  const unsent = photos.filter((photo) => photo.state !== 'sent')

  function setPhoto(key: string, change: Partial<ChosenPhoto>) {
    setPhotos((current) =>
      current.map((photo) => (photo.key === key ? { ...photo, ...change } : photo)),
    )
  }

  function submit() {
    setRefusal(null)

    startTransition(async () => {
      let id = inspectionId
      const recordedNow = id === null

      if (id === null) {
        const written = await recordFirst()

        if (written === null) {
          return
        }

        id = written
        setInspectionId(written)
      }

      setStep('sending')

      let sent = 0
      let failed = 0

      // Sequential on purpose: five parallel uploads on one bar of signal is
      // five timeouts instead of one slow success, and five decoded originals
      // at once is how a mid-range phone runs out of memory.
      for (const photo of unsent) {
        setPhoto(photo.key, { state: 'sending', message: undefined })

        const result = await sendPhoto(photo.file, bookingId, id)

        if (result.ok) {
          sent += 1
          setPhoto(photo.key, { state: 'sent' })
        } else {
          failed += 1
          setPhoto(photo.key, { state: 'failed', message: result.message })
        }
      }

      setStep('idle')
      announce({ recordedNow, unitRef, sent, failed })

      if (failed === 0) {
        router.push('/field/departures')
      }
    })
  }

  /** Writes the inspection. Null when it was refused or never arrived. */
  async function recordFirst(): Promise<string | null> {
    if (outcome === null) {
      setRefusal({ fieldErrors: { outcome: 'Choose how the unit was found.' } })

      return null
    }

    const check = checkInspectionNotes(outcome, notes)

    if (!check.ok) {
      setRefusal({ fieldErrors: { notes: check.error.message } })

      return null
    }

    setStep('recording')

    let result: TurnoverActionState

    try {
      result = await recordFieldInspectionAction(
        { status: 'idle' },
        formDataOf({ bookingId, outcome, notes }),
      )
    } catch {
      setStep('idle')
      setRefusal({ message: DID_NOT_GO_THROUGH })

      return null
    }

    if (result.status !== 'done' || !result.inspectionId) {
      setStep('idle')
      setRefusal({ message: result.message, fieldErrors: result.fieldErrors })

      return null
    }

    return result.inspectionId
  }

  return (
    <div className="mt-xl grid gap-xl">
      <fieldset disabled={isRecorded || isPending} className="grid gap-sm">
        <legend className="text-body-md-strong text-foreground">How was the unit found?</legend>

        <div className="mt-sm grid grid-cols-2 gap-md">
          {INSPECTION_OUTCOMES.map((value) => {
            const isChosen = outcome === value

            return (
              <label
                key={value}
                className={cn(
                  'flex min-h-touch items-center justify-center gap-sm rounded-lg border bg-card px-md py-lg text-body-md transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                  isChosen
                    ? 'border-foreground font-medium text-foreground'
                    : 'border-border text-muted-foreground',
                  isRecorded ? 'cursor-default' : 'cursor-pointer hover:bg-muted',
                  isRecorded && !isChosen && 'opacity-60',
                )}
              >
                <input
                  type="radio"
                  name="outcome"
                  value={value}
                  checked={isChosen}
                  onChange={() => setOutcome(value)}
                  className="sr-only"
                />
                {isChosen ? <Check aria-hidden className="size-4" /> : null}
                {INSPECTION_OUTCOME_LABELS[value]}
              </label>
            )
          })}
        </div>

        {refusal?.fieldErrors?.outcome ? (
          <FieldError message={refusal.fieldErrors.outcome} />
        ) : null}
      </fieldset>

      <div className="grid gap-sm">
        <Label htmlFor="inspection-notes">
          {needsNotes ? 'What was found?' : 'Notes (optional)'}
        </Label>
        <Textarea
          id="inspection-notes"
          inputSize="touch"
          rows={4}
          required={needsNotes}
          disabled={isRecorded || isPending}
          maxLength={MAX_INSPECTION_NOTES_LENGTH}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={
            needsNotes
              ? 'Shower screen cracked, bottom left. Two towels missing.'
              : 'Anything worth knowing about the unit.'
          }
          aria-invalid={Boolean(refusal?.fieldErrors?.notes)}
        />
        {refusal?.fieldErrors?.notes ? (
          <FieldError message={refusal.fieldErrors.notes} />
        ) : (
          <p className="text-caption text-muted-foreground">
            Recorded with your name and the time, and cannot be changed afterwards.
          </p>
        )}
      </div>

      <PhotoPicker
        id="inspection-photos"
        photos={photos}
        disabled={isPending}
        onAdd={(files) =>
          setPhotos((current) => [
            ...current,
            ...files.map((file) => ({
              key: crypto.randomUUID(),
              file,
              state: 'waiting' as const,
            })),
          ])
        }
        onRemove={(key) => setPhotos((current) => current.filter((photo) => photo.key !== key))}
      />

      {isRecorded ? (
        <Notice>
          The inspection of {unitRef} is recorded and cannot be changed.{' '}
          {unsent.length > 0
            ? 'Send the photos still on the list, or go back — photos can be added later.'
            : 'Photos can still be added to it.'}
        </Notice>
      ) : null}

      {refusal?.message && !refusal.fieldErrors ? <FieldError message={refusal.message} /> : null}

      <div className="grid gap-sm">
        <Button
          type="button"
          size="touch"
          className="w-full"
          onClick={submit}
          disabled={
            isPending || (!isRecorded && outcome === null) || (isRecorded && unsent.length === 0)
          }
        >
          {buttonLabel({ step, isRecorded, unsent: unsent.length })}
        </Button>

        {isRecorded ? (
          <Button asChild variant="tertiary" size="touch" className="w-full">
            <Link href="/field/departures">Back to departures</Link>
          </Button>
        ) : null}
      </div>

      <p className="sr-only" aria-live="polite">
        {step === 'recording' ? `Recording the inspection of ${reference}` : ''}
      </p>
    </div>
  )
}

/* ── The pieces the form leans on ─────────────────────────────────────────── */

function formDataOf(fields: Record<string, string>): FormData {
  const data = new FormData()

  for (const [name, value] of Object.entries(fields)) {
    data.set(name, value)
  }

  return data
}

/** Shrinks one photograph and sends it against the inspection. */
async function sendPhoto(
  file: File,
  bookingId: string,
  inspectionId: string,
): Promise<SendOutcome> {
  try {
    const prepared = await preparePhoto(file, { maxBytes: MAX_DOCUMENT_BYTES })

    if (!prepared.ok) {
      return prepared
    }

    const data = formDataOf({ kind: 'inspection_photo', bookingId, inspectionId })

    data.set('file', prepared.photo.file)

    const result = await attachDocumentAction({ status: 'idle' }, data)

    return result.status === 'done'
      ? { ok: true }
      : { ok: false, message: result.fieldErrors?.file ?? result.message ?? 'Not sent.' }
  } catch {
    return {
      ok: false,
      message: 'Did not go through. Check the phone has signal and send it again.',
    }
  }
}

/**
 * What the toast says. An inspection that landed is stated even when every
 * photograph failed — it is the thing the deposit release waits on, and a
 * silent toast would send somebody looking for a record that is already there.
 */
function announce({
  recordedNow,
  unitRef,
  sent,
  failed,
}: {
  recordedNow: boolean
  unitRef: string
  sent: number
  failed: number
}): void {
  if (!recordedNow && sent === 0) {
    return
  }

  const photos = sent === 0 ? '' : sent === 1 ? ' One photo sent.' : ` ${sent} photos sent.`
  const failures = failed > 0 ? ' Some photos did not go up — they are still on the list.' : ''

  toast({
    tone: 'positive',
    title: recordedNow ? `${unitRef} inspected` : sent === 1 ? 'Photo sent' : `${sent} photos sent`,
    description: recordedNow
      ? `${photos}${failures}`.trim() || undefined
      : failures.trim() || undefined,
  })
}

function buttonLabel({
  step,
  isRecorded,
  unsent,
}: {
  step: 'idle' | 'recording' | 'sending'
  isRecorded: boolean
  unsent: number
}): string {
  if (step === 'recording') {
    return 'Recording…'
  }

  if (step === 'sending') {
    return 'Sending photos…'
  }

  if (isRecorded) {
    return unsent === 1 ? 'Send photo' : 'Send photos'
  }

  return unsent === 0 ? 'Record inspection' : 'Record and send photos'
}
