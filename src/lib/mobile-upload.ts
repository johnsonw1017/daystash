import { z } from 'zod'

export const MOBILE_UPLOAD_SESSION_TTL_MS = 30 * 60 * 1000

export const mobileUploadSessionRequestSchema = z.object({
  editorSessionId: z.string().uuid(),
  insertAfterBlockClientId: z.string().uuid(),
})

export const mobileUploadCompleteRequestSchema = z.object({
  token: z.string().min(1),
  image: z.object({
    publicId: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
})

export const mobileUploadConsumeRequestSchema = z.object({
  token: z.string().min(1),
})

export const mobileUploadReleaseRequestSchema = z.object({
  token: z.string().min(1),
  imageIds: z.array(z.string().min(1)).min(1),
})

export type StagedMobileUploadImage = {
  id: string
  publicId: string
  width: number
  height: number
  created_at: string
}
