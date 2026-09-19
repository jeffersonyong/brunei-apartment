import type { SiteImage } from '@/lib/db/site-images'
import {
  FEED_SLOTS,
  aspectFor,
  placementKey,
  type SiteImageAspect,
  type SiteImageFocus,
  type SiteImagePlacement,
} from '@/lib/domain/site-image'

/**
 * The photographs screen, laid out the way the front page is (capability F7).
 *
 * Four sections in the landing page's own order, and within each exactly the
 * cards the page renders. Both the facilities and the unit types are passed in
 * from Property settings (17 September 2026), because that is where those
 * sections get their cards — so a type staff add, or a facility they tick into
 * the day pass, has a place to hang a photograph on the same day. Pure, so the
 * arrangement is tested without a page.
 */

export interface CurrentPhotoView {
  id: string
  url: string
  altText: string
  focus: SiteImageFocus
  uploadedAt: string
  /** Who put it up, as a name. */
  uploadedBy: string
}

export interface PhotoSlotView {
  /** The placement key the actions are sent (`hero`, `facility:water-park`, …). */
  key: string
  /** What the place is called on the site. */
  name: string
  aspect: SiteImageAspect
  current: CurrentPhotoView | null
  /**
   * A facility's card only: whether the landing page shows it, and the slug
   * the switch is sent. Absent for every other place, which has no switch.
   */
  visibility?: { slug: string; shown: boolean }
}

export interface PhotoSectionView {
  id: string
  title: string
  hint: string
  slots: readonly PhotoSlotView[]
}

/**
 * One place and the photograph in it, if any. Exported for the Food tab, whose
 * menu flyer is a photograph edited on a screen of its own.
 */
export function photoSlotView(
  images: readonly SiteImage[],
  nameFor: (userId: string) => string,
  placement: SiteImagePlacement,
  name: string,
): PhotoSlotView {
  const key = placementKey(placement)
  const image = images.find((candidate) => placementKey(candidate.placement) === key)

  return {
    key,
    name,
    aspect: aspectFor(placement),
    current: image
      ? {
          id: image.id,
          url: image.url,
          altText: image.altText,
          focus: image.focus,
          uploadedAt: image.uploadedAt,
          uploadedBy: nameFor(image.uploadedBy),
        }
      : null,
  }
}

export function photoSections(
  images: readonly SiteImage[],
  nameFor: (userId: string) => string,
  unitTypes: readonly { slug: string; name: string }[],
  /**
   * The facilities the day pass admits — every card that section can show,
   * including the ones switched off, so they can be switched back on.
   */
  dayPassFacilities: readonly { slug: string; name: string; shownOnSite: boolean }[],
): readonly PhotoSectionView[] {
  const slotView = (placement: SiteImagePlacement, name: string): PhotoSlotView =>
    photoSlotView(images, nameFor, placement, name)

  return [
    {
      id: 'front-page',
      title: 'Front page',
      hint: 'The photograph beside the headline at the top of the front page — the first thing a visitor sees.',
      slots: [slotView({ kind: 'slot', slot: 'hero' }, 'Front page')],
    },
    {
      id: 'day-pass',
      title: 'Day pass',
      hint: 'One photograph for each facility card in the day-pass section. Switch a card off to leave it off the front page — the day-pass booking page still lists it.',
      slots: dayPassFacilities.map((facility) => ({
        ...slotView({ kind: 'facility', slug: facility.slug }, facility.name),
        visibility: { slug: facility.slug, shown: facility.shownOnSite },
      })),
    },
    {
      id: 'short-stays',
      title: 'Short stays',
      hint: 'One photograph for each unit type in the stays section.',
      slots: unitTypes.map((unit) => slotView({ kind: 'unit_type', slug: unit.slug }, unit.name)),
    },
    {
      id: 'follow-along',
      title: 'Follow along',
      hint: 'The four square tiles above the Instagram and TikTok links, in order.',
      slots: FEED_SLOTS.map((slot, index) => slotView({ kind: 'slot', slot }, `Tile ${index + 1}`)),
    },
  ]
}
