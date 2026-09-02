'use server'

import { z } from 'zod'
import { createServerSideClient } from '@/lib/supabase/server'

const profileSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  avatarUrl: z.string().url().nullable(),
})

type UpdateProfileInput = z.infer<typeof profileSchema>

export const updateProfile = async (input: UpdateProfileInput) => {
  const parsed = profileSchema.safeParse(input)

  if (!parsed.success) {
    return { error: 'Please enter a valid name and avatar.' }
  }

  const supabase = await createServerSideClient()
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  if (claimsError || typeof userId !== 'string') {
    return { error: 'Please log in again to update your profile.' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.fullName,
      avatar_url: parsed.data.avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('id')
    .single()

  if (error || !data) {
    return { error: error?.message ?? 'Profile could not be updated.' }
  }

  return { success: true }
}
