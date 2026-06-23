import { z } from 'zod'

export const MOBILE_UPLOAD_SESSION_TTL_MS = 30 * 60 * 1000

export const mobileUploadSessionRequestSchema = z.object({
  editorSessionId: z.string().uuid(),
  insertAfterBlockClientId: z.string().uuid(),
})

export const mobileUploadCompleteRequestSchema = z.object({
  token: z.string().min(1),
  image: z.object({
    cloudinary_public_id: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    alt_text: z.string().trim().min(1).nullable().optional(),
  }),
})

export const mobileUploadConsumeRequestSchema = z.object({
  token: z.string().min(1),
})

export type StagedMobileUploadImage = {
  id: string
  cloudinary_public_id: string
  width: number
  height: number
  alt_text: string | null
  position: number
  created_at: string
}
