'use client'

import { useState } from 'react'
import { Camera, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field-error'
import { acceptAttributeFor, formatByteSize } from '@/lib/domain/document'
import { MAX_PHOTO_ORIGINAL_BYTES } from '@/lib/domain/image-size'

/**
 * Choosing photographs on a phone, and seeing each one go up (capability C2).
 *
 * The same two decisions as components/portal/file-field.tsx — a real
 * `<label>` opens the picker without script, and the accepted types are
 * explicit so iOS converts a HEIC capture to JPEG — drawn at the field
 * surface's size, and with two differences a phone in a unit needs:
 *
 * - **No `capture` attribute.** With it, a phone opens the camera and nothing
 *   else; without it, the operating system offers the camera *or* the photos
 *   already taken, which is how a cleaner who photographed the room first
 *   attaches them.
 * - **Photographs accumulate.** Each choice adds to the list rather than
 *   replacing it, so three taken now and two more after the bathroom is one
 *   list, and any one can be taken off it before sending.
 *
 * The size ceiling here is the original's, 25 MiB — what a phone can be asked
 * to open. What is sent is shrunk first (components/prepare-photo.ts) and lands
 * well under the server's 4 MiB, so a camera original is no longer refused.
 *
 * The parent owns the list and each photograph's state, because the parent is
 * what sends them one by one and knows which went up.
 */

export type ChosenPhotoState = 'waiting' | 'sending' | 'sent' | 'failed'

export interface ChosenPhoto {
  key: string
  file: File
  state: ChosenPhotoState
  /** Why it failed, in words. */
  message?: string
}

interface PhotoPickerProps {
  /** Unique on the screen. */
  id: string
  photos: readonly ChosenPhoto[]
  onAdd: (files: File[]) => void
  onRemove: (key: string) => void
  /** While photographs are being sent, the list cannot change under the loop. */
  disabled?: boolean
}

export function PhotoPicker({ id, photos, onAdd, onRemove, disabled }: PhotoPickerProps) {
  const [refused, setRefused] = useState<readonly string[]>([])
  const labelId = `${id}-label`

  return (
    <div className="grid gap-sm">
      <span id={labelId} className="text-body-md-strong text-foreground">
        Photos (optional)
      </span>

      <label
        htmlFor={id}
        className={
          disabled
            ? 'flex min-h-touch w-full items-center justify-center gap-sm rounded-md border border-border bg-card px-xl text-button-md text-muted-foreground opacity-60'
            : 'flex min-h-touch w-full cursor-pointer items-center justify-center gap-sm rounded-md border border-border bg-card px-xl text-button-md text-foreground transition-colors focus-within:ring-2 focus-within:ring-ring hover:bg-muted'
        }
      >
        <Camera aria-hidden className="size-4" />
        {photos.length === 0 ? 'Add photos' : 'Add more photos'}
      </label>
      <input
        id={id}
        type="file"
        aria-labelledby={labelId}
        accept={acceptAttributeFor('inspection_photo')}
        multiple
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const chosen = Array.from(event.target.files ?? [])
          const tooLarge = chosen.filter((file) => file.size > MAX_PHOTO_ORIGINAL_BYTES)

          setRefused(tooLarge.map((file) => file.name))
          onAdd(chosen.filter((file) => file.size <= MAX_PHOTO_ORIGINAL_BYTES))
          // Emptied so the same photograph can be chosen again after being
          // taken off the list.
          event.target.value = ''
        }}
      />

      {refused.length > 0 ? (
        <FieldError
          message={`${refused.length === 1 ? refused[0] : `${refused.length} files`} ${refused.length === 1 ? 'is' : 'are'} larger than ${Math.round(MAX_PHOTO_ORIGINAL_BYTES / (1024 * 1024))} MB and cannot be opened on a phone.`}
        />
      ) : (
        <p className="text-caption text-muted-foreground">
          JPEG, PNG or WebP. Made smaller on this phone before they are sent.
        </p>
      )}

      {photos.length > 0 ? (
        <ul className="grid gap-xs" aria-label="Photos chosen">
          {photos.map((photo) => (
            <li
              key={photo.key}
              className="flex min-h-touch items-center justify-between gap-md rounded-md bg-muted py-xs pr-xxs pl-md"
            >
              <div className="min-w-0">
                <p className="truncate text-body-sm text-foreground">{photo.file.name}</p>
                <p
                  className={
                    photo.state === 'failed'
                      ? 'text-caption break-words text-negative-deep'
                      : 'text-caption text-muted-foreground tabular-nums'
                  }
                >
                  {stateLabel(photo)}
                </p>
              </div>

              {photo.state === 'waiting' || photo.state === 'failed' ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="touch"
                  disabled={disabled}
                  aria-label={`Take ${photo.file.name} off the list`}
                  onClick={() => onRemove(photo.key)}
                >
                  <X aria-hidden />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function stateLabel(photo: ChosenPhoto): string {
  switch (photo.state) {
    case 'waiting':
      return formatByteSize(photo.file.size)
    case 'sending':
      return 'Sending…'
    case 'sent':
      return 'Sent'
    case 'failed':
      return photo.message ?? 'Not sent'
  }
}
