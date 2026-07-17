import { describe, expect, it } from 'vitest'
import manifest from '@/app/manifest'

describe('PWA manifest', () => {
  it('provides an installable standalone Daystash experience', () => {
    const value = manifest()

    expect(value.name).toBe('Daystash')
    expect(value.display).toBe('standalone')
    expect(value.start_url).toBe('/dashboard')
    expect(value.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: '192x192' }),
        expect.objectContaining({ sizes: '512x512' }),
        expect.objectContaining({ purpose: 'maskable' }),
      ])
    )
  })
})
