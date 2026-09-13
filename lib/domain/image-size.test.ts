import { describe, expect, test } from 'vitest'

import { fitWithin, MAX_PHOTO_ORIGINAL_BYTES, SHRINK_LONG_EDGE } from './image-size'

/**
 * The numbers the browser shrinks a photograph to (capabilities F7 and C2).
 *
 * The shrink itself needs a canvas and is exercised in the browser; the sizes
 * it aims at are pure, and are what decide whether a phone's photograph fits
 * under the upload ceiling at all.
 */

describe('fitWithin', () => {
  test('scales a phone photograph down to 2400 on its long edge, keeping its shape', () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 2400, height: 1800 })
    expect(fitWithin(3024, 4032)).toEqual({ width: 1800, height: 2400 })
  })

  test('scales a 50-megapixel original the same way', () => {
    expect(fitWithin(8160, 6120)).toEqual({ width: 2400, height: 1800 })
  })

  test('never enlarges a photograph that is already small enough', () => {
    expect(fitWithin(1600, 1200)).toEqual({ width: 1600, height: 1200 })
    expect(fitWithin(2400, 2400)).toEqual({ width: 2400, height: 2400 })
  })

  test('never rounds a thin edge away to nothing', () => {
    expect(fitWithin(10_000, 3)).toEqual({ width: 2400, height: 1 })
  })

  test('has no answer for an image with no size', () => {
    expect(fitWithin(0, 1200)).toBeNull()
    expect(fitWithin(Number.NaN, 1200)).toBeNull()
  })

  test('takes a different ceiling when asked', () => {
    expect(fitWithin(4000, 2000, 1000)).toEqual({ width: 1000, height: 500 })
  })
})

describe('the ceilings', () => {
  test('photographs are sent at no more than 2400 on the long edge', () => {
    expect(SHRINK_LONG_EDGE).toBe(2400)
  })

  test('a phone is asked to open an original of up to 25 MiB', () => {
    expect(MAX_PHOTO_ORIGINAL_BYTES).toBe(25 * 1024 * 1024)
  })
})
