import { describe, expect, it } from 'vitest'
import { getCarouselViewportAspectRatio } from '@/lib/journal-image-block'

describe('getCarouselViewportAspectRatio', () => {
  it('uses the widest image ratio so every image fits inside the carousel viewport', () => {
    expect(
      getCarouselViewportAspectRatio([
        { width: 1200, height: 900 },
        { width: 1600, height: 900 },
        { width: 800, height: 1200 },
      ])
    ).toBeCloseTo(16 / 9)
  })

  it('ignores invalid image dimensions', () => {
    expect(
      getCarouselViewportAspectRatio([
        { width: 0, height: 900 },
        { width: 1200, height: -1 },
        { width: 1000, height: 1000 },
      ])
    ).toBe(1)
  })

  it('falls back to a square viewport when no usable dimensions exist', () => {
    expect(getCarouselViewportAspectRatio([])).toBe(1)
  })
})
