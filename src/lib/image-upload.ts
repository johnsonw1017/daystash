'use client'

import imageCompression from 'browser-image-compression'
import { v4 as uuidv4 } from 'uuid'

type UploadResult = {
  publicId: string
  width: number
  height: number
}

type UploadOptions = {
  maxWidthOrHeight: number
  maxSizeMB: number
  path: (userId: string, uuid: string) => string
}

const DEFAULT_IMAGE_COMPRESSION = {
  maxWidthOrHeight: 1800,
  maxSizeMB: 1,
} as const

const toWebPFile = async (
  file: File,
  {
    maxWidthOrHeight,
    maxSizeMB,
  }: Pick<UploadOptions, 'maxWidthOrHeight' | 'maxSizeMB'>
) => {
  return imageCompression(file, {
    maxWidthOrHeight,
    maxSizeMB,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.8,
  })
}

const getImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
      URL.revokeObjectURL(objectUrl)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Unable to read image dimensions'))
    }

    image.src = objectUrl
  })
}

const uploadFilesToCloudinary = async (
  files: File[],
  userId: string,
  options: UploadOptions
): Promise<UploadResult[]> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary upload env vars are missing')
  }

  const uploads = files.map(async (file) => {
    const compressed = await toWebPFile(file, options)
    const uuid = uuidv4()
    const publicId = options.path(userId, uuid)

    const formData = new FormData()
    formData.append('file', compressed)
    formData.append('upload_preset', uploadPreset)
    formData.append('public_id', publicId)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error('Image upload failed')
    }

    const data = await response.json()
    const dimensions =
      typeof data.width === 'number' && typeof data.height === 'number'
        ? { width: data.width, height: data.height }
        : await getImageDimensions(compressed)

    return {
      publicId: data.public_id,
      width: dimensions.width,
      height: dimensions.height,
    }
  })

  return Promise.all(uploads)
}

export const uploadImagesToCloudinary = async (
  files: File[],
  userId: string
): Promise<UploadResult[]> =>
  uploadFilesToCloudinary(files, userId, {
    ...DEFAULT_IMAGE_COMPRESSION,
    path: (id, uuid) => `daystash/${id}/${uuid}`,
  })

export const uploadAvatarToCloudinary = async (
  file: File,
  userId: string
): Promise<UploadResult> => {
  const [avatar] = await uploadFilesToCloudinary([file], userId, {
    ...DEFAULT_IMAGE_COMPRESSION,
    path: (id, uuid) => `daystash/${id}/avatars/${uuid}`,
  })

  return avatar
}
