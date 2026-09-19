import { contact } from '../_content/landing'
import { LocationMap, OpenInMapsButton, PropertyAddress } from './location'

/** Half the 1120px container from `lg`; the full width below it. */
const MAP_SIZES = '(min-width: 1024px) 544px, 100vw'

/**
 * Where to find us (Jeff, 19 September 2026). A guest who has booked, or is
 * deciding whether the drive is worth it, should not have to message anyone
 * to learn where the building is.
 *
 * The white band with a hairline above it, like its neighbours. The page's
 * tinted pause is "How it works", and a second one would stop being a pause.
 * `#getting-here` is the footer's link.
 */
export function GettingHereSection() {
  return (
    <section
      aria-labelledby="getting-here-heading"
      id="getting-here"
      className="scroll-mt-xl border-t border-divider bg-card px-xl py-3xl"
    >
      <div className="mx-auto grid w-full max-w-[1120px] gap-2xl lg:grid-cols-2 lg:items-center">
        <div>
          <p className="micro-label text-muted-foreground">{contact.locality}, Brunei</p>
          <h2
            id="getting-here-heading"
            className="mt-md font-display text-display-md text-foreground"
          >
            Getting here
          </h2>
          <PropertyAddress className="mt-lg" />
          <OpenInMapsButton className="mt-xl w-full sm:w-auto" />
        </div>

        <LocationMap sizes={MAP_SIZES} />
      </div>
    </section>
  )
}
