/**
 * How big a photograph is sent, wherever it is going (capabilities F7 and C2).
 *
 * A phone camera's original is larger than the 4 MiB a server action can
 * receive on Vercel (architecture.md §8.1), so a photograph is shrunk in the
 * browser before it is sent — components/prepare-photo.ts — and the numbers that
 * shrink works to live here, where a unit test can reach them without a canvas.
 *
 * Moved out of lib/domain/site-image.ts when the housekeeping phone screen
 * started sending inspection photographs. The public site and a cleaner's
 * evidence share the shrink, and neither module has any business knowing the
 * other exists.
 */

/**
 * The longest edge a photograph is sent at.
 *
 * The widest slot on the public site is the hero, a little over 540px across on
 * a desktop and full width on a phone — 2400 covers either at three times the
 * pixel density. For an inspection it is ample to read a crack in a shower
 * screen, and a JPEG that size sits comfortably under the 4 MiB ceiling.
 */
export const SHRINK_LONG_EDGE = 2400

/**
 * The largest original a phone is asked to open.
 *
 * Not a ceiling on what is stored — that is the shrink's output, which the
 * server checks against its own 4 MiB. This bounds only what a browser has to
 * decode, and a photograph from any phone camera sits under it.
 */
export const MAX_PHOTO_ORIGINAL_BYTES = 25 * 1024 * 1024

/**
 * The size a photograph is shrunk to: its own shape, with the long edge no
 * longer than the ceiling, and never enlarged.
 *
 * Null for an image with no usable size, which is a decode that failed rather
 * than a photograph.
 */
export function fitWithin(
  width: number,
  height: number,
  maxLongEdge: number = SHRINK_LONG_EDGE,
): { width: number; height: number } | null {
  if (!(Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0)) {
    return null
  }

  const scale = Math.min(1, maxLongEdge / Math.max(width, height))

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}
