import { describe, expect, it } from 'vitest'
import {
  mobileUploadCompleteRequestSchema,
  mobileUploadConsumeRequestSchema,
  mobileUploadReleaseRequestSchema,
  mobileUploadSessionRequestSchema,
} from '@/lib/mobile-upload'

const uuid = '4dc49547-1392-49f2-ad94-163be51b6762'

describe('mobile upload request schemas', () => {
  it('accepts a valid session request', () => {
    expect(
      mobileUploadSessionRequestSchema.safeParse({
        editorSessionId: uuid,
        insertAfterBlockClientId: uuid,
      }).success
    ).toBe(true)
  })

  it('requires positive integer image dimensions when completing an upload', () => {
    const validResult = mobileUploadCompleteRequestSchema.safeParse({
      token: 'upload-token',
      image: {
        publicId: 'journal/day-1',
        width: 1200,
        height: 900,
      },
    })
    const invalidResult = mobileUploadCompleteRequestSchema.safeParse({
      token: 'upload-token',
      image: {
        publicId: 'journal/day-1',
        width: 1200.5,
        height: 0,
      },
    })

    expect(validResult.success).toBe(true)
    expect(invalidResult.success).toBe(false)
  })

  it('requires a token when consuming an upload', () => {
    expect(mobileUploadConsumeRequestSchema.safeParse({ token: 'upload-token' }).success).toBe(
      true
    )
    expect(mobileUploadConsumeRequestSchema.safeParse({ token: '' }).success).toBe(false)
  })

  it('requires at least one image id when releasing staged uploads', () => {
    expect(
      mobileUploadReleaseRequestSchema.safeParse({
        token: 'upload-token',
        imageIds: ['image-1'],
      }).success
    ).toBe(true)
    expect(
      mobileUploadReleaseRequestSchema.safeParse({
        token: 'upload-token',
        imageIds: [],
      }).success
    ).toBe(false)
  })
})
