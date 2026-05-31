import type { ImageLoaderProps } from 'next/image'

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

export const getCloudinaryImageUrl = (publicId: string) => {
  if (!cloudName || !publicId) return ''

  const encodedPublicId = publicId
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')

  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${encodedPublicId}`
}

export const cloudinaryLoader = ({
  src,
  width,
  quality,
}: ImageLoaderProps) => {
  if (!cloudName || !src) return ''

  const encodedPublicId = src
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')

  const qualityValue = quality ?? 'auto'

  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_${qualityValue},w_${width}/${encodedPublicId}`
}
