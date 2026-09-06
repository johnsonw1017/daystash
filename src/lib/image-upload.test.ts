import { beforeEach, describe, expect, it, vi } from 'vitest'
import imageCompression from 'browser-image-compression'
import { v4 as uuidv4 } from 'uuid'
import { uploadAvatarToCloudinary } from '@/lib/image-upload'
import { asMockedValue } from '@/test/mocks/types'

vi.mock('browser-image-compression', () => ({
  default: vi.fn(),
}))

vi.mock('uuid', () => ({
  v4: vi.fn(),
}))

const mockedCompression = vi.mocked(imageCompression)
const mockedUuid = vi.mocked(uuidv4)

describe('uploadAvatarToCloudinary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'daystash-cloud')
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET', 'daystash-uploads')
  })

  it('compresses and uploads an avatar to a user-specific Cloudinary path', async () => {
    const source = new File(['source'], 'avatar.png', { type: 'image/png' })
    const compressed = new File(['compressed'], 'avatar.webp', {
      type: 'image/webp',
    })
    mockedCompression.mockResolvedValue(compressed)
    mockedUuid.mockReturnValue(
      asMockedValue<ReturnType<typeof uuidv4>>('avatar-id')
    )
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          public_id: 'daystash/user-id/avatars/avatar-id',
          width: 512,
          height: 512,
        }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(uploadAvatarToCloudinary(source, 'user-id')).resolves.toEqual({
      publicId: 'daystash/user-id/avatars/avatar-id',
      width: 512,
      height: 512,
    })

    expect(mockedCompression).toHaveBeenCalledWith(
      source,
      expect.objectContaining({
        maxWidthOrHeight: 1800,
        maxSizeMB: 1,
        fileType: 'image/webp',
      })
    )
    const body = fetchMock.mock.calls[0]?.[1]?.body as FormData
    expect(body.get('public_id')).toBe('daystash/user-id/avatars/avatar-id')
  })
})
