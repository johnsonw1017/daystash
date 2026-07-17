import { afterEach, describe, expect, it, vi } from 'vitest'

const importCloudinary = async () => {
  vi.resetModules()
  return import('@/lib/cloudinary')
}

describe('Cloudinary URL helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns an empty image URL when Cloudinary is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', '')
    const { getCloudinaryImageUrl } = await importCloudinary()

    expect(getCloudinaryImageUrl('journal/day 1')).toBe('')
  })

  it('builds Cloudinary image URLs with encoded public id path segments', async () => {
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'daystash-cloud')
    const { getCloudinaryImageUrl } = await importCloudinary()

    expect(getCloudinaryImageUrl('journal/day 1/photo #1')).toBe(
      'https://res.cloudinary.com/daystash-cloud/image/upload/f_auto,q_auto/journal/day%201/photo%20%231'
    )
  })

  it('builds loader URLs with width and quality transformations', async () => {
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'daystash-cloud')
    const { cloudinaryLoader } = await importCloudinary()

    expect(
      cloudinaryLoader({
        src: 'journal/day 1/photo #1',
        width: 640,
        quality: 80,
      })
    ).toBe(
      'https://res.cloudinary.com/daystash-cloud/image/upload/f_auto,q_80,w_640/journal/day%201/photo%20%231'
    )
  })

  it('uses automatic quality when the loader quality is omitted', async () => {
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'daystash-cloud')
    const { cloudinaryLoader } = await importCloudinary()

    expect(cloudinaryLoader({ src: 'journal/photo', width: 1200 })).toBe(
      'https://res.cloudinary.com/daystash-cloud/image/upload/f_auto,q_auto,w_1200/journal/photo'
    )
  })
})
