import type { JournalImageAsset } from '@/lib/journals'

export const MAX_IMAGE_BLOCK_IMAGES = 12

export const getCarouselViewportAspectRatio = (
  images: Pick<JournalImageAsset, 'height' | 'width'>[]
) => {
  const shortestImageRatio = images.reduce((shortestRatio, image) => {
    if (image.width <= 0 || image.height <= 0) {
      return shortestRatio
    }

    return Math.min(shortestRatio, image.height / image.width)
  }, Number.POSITIVE_INFINITY)

  if (!Number.isFinite(shortestImageRatio) || shortestImageRatio <= 0) {
    return 1
  }

  return 1 / shortestImageRatio
}
