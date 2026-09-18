'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/components/ui/toast-store'
import { formatInstantAsDate } from '@/lib/domain/dates'
import { cn } from '@/lib/utils'

import { setFacilityShownAction } from './actions'
import { EditPhotoDialog } from './edit-photo-dialog'
import { PHOTO_ASPECT_CLASSES, PhotoFrame } from './photo-frame'
import type { PhotoSlotView } from './photo-sections'
import { PlacePhotoDialog } from './place-photo-dialog'
import { RemovePhotoDialog } from './remove-photo-dialog'

/** A card's preview is a quarter of the panel on a wide screen, half on a tablet. */
const PREVIEW_SIZES = '(min-width: 1024px) 260px, (min-width: 640px) 45vw, 90vw'

/**
 * One place on the website and the photograph in it (capability F7).
 *
 * A place with a photograph shows it at the site's own crop, what it is
 * described as, and who put it up, with Replace, Edit and Remove. An empty
 * place is the recessed panel design.md gives absence — no hairline, because
 * there is nothing to draw — with the one action that fills it.
 *
 * A facility's place also carries the switch that keeps its card off the
 * front page (Jeff, 18 September 2026) — for a facility with no photograph
 * yet, or one the business would rather not advertise. Switched off, the
 * preview fades so the list says at a glance which cards the site is showing.
 */
export function PhotoSlot({ slot }: { slot: PhotoSlotView }) {
  const [open, setOpen] = useState<'place' | 'edit' | 'remove' | null>(null)
  const { current, visibility } = slot
  const isHidden = visibility?.shown === false
  const close = () => setOpen(null)

  return (
    <div className="grid content-start gap-sm">
      <div className={cn('transition-opacity', isHidden && 'opacity-50')}>
        {current ? (
          <PhotoFrame
            src={current.url}
            alt={current.altText}
            aspect={slot.aspect}
            focus={current.focus}
            sizes={PREVIEW_SIZES}
          />
        ) : (
          <div
            className={cn(
              'flex flex-col items-center justify-center gap-sm rounded-md bg-muted px-md text-center',
              PHOTO_ASPECT_CLASSES[slot.aspect],
            )}
          >
            <p className="text-caption text-muted-foreground">
              {isHidden ? 'No photo yet' : 'No photo yet — the website shows a placeholder'}
            </p>
            <Button variant="tertiary" onClick={() => setOpen('place')}>
              <Plus aria-hidden />
              Add photo
            </Button>
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-body-sm-strong text-foreground">{slot.name}</p>
        {current ? (
          <>
            <p className="line-clamp-2 text-caption text-muted-foreground">{current.altText}</p>
            <p className="text-caption text-muted-foreground">
              Added {formatInstantAsDate(current.uploadedAt)} by {current.uploadedBy}
            </p>
          </>
        ) : null}
      </div>

      {visibility ? <ShownOnSite name={slot.name} {...visibility} /> : null}

      {current ? (
        <div className="flex flex-wrap gap-xs">
          <Button variant="tertiary" onClick={() => setOpen('place')}>
            Replace
          </Button>
          <Button variant="tertiary" onClick={() => setOpen('edit')}>
            Edit
          </Button>
          <Button variant="destructive-tertiary" onClick={() => setOpen('remove')}>
            Remove
          </Button>
        </div>
      ) : null}

      {open === 'place' ? <PlacePhotoDialog slot={slot} onClose={close} /> : null}
      {open === 'edit' && current ? (
        <EditPhotoDialog slot={slot} current={current} onClose={close} />
      ) : null}
      {open === 'remove' && current ? (
        <RemovePhotoDialog slot={slot} imageId={current.id} onClose={close} />
      ) : null}
    </div>
  )
}

/**
 * The switch itself. Saved the moment it is changed, like the FAQs' "Front
 * page" tick, because it is the whole of the change — there is nothing else
 * on the card to save it with.
 */
function ShownOnSite({ slug, shown, name }: { slug: string; shown: boolean; name: string }) {
  const [isPending, startTransition] = useTransition()
  const id = `shown-on-site-${slug}`

  function change(next: boolean) {
    startTransition(async () => {
      const data = new FormData()

      data.set('slug', slug)
      data.set('shown', next ? 'true' : 'false')

      const outcome = await setFacilityShownAction({ status: 'idle' }, data)

      if (outcome.status !== 'done') {
        toast({ tone: 'negative', title: outcome.message ?? 'That change could not be saved.' })
        return
      }

      toast({
        tone: 'positive',
        title: next ? `${name} is on the front page` : `${name} is off the front page`,
      })
    })
  }

  return (
    <label htmlFor={id} className="flex items-center gap-xs text-body-sm text-foreground">
      <Checkbox
        id={id}
        checked={shown}
        disabled={isPending}
        onCheckedChange={(checked) => change(checked === true)}
      />
      Show on the front page
    </label>
  )
}
