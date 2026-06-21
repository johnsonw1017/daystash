'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthUser } from '@/hooks/use-auth-user'
import supabase from '@/lib/supabase/client'

export type Profile = {
  id: string
  updated_at: string | null
  full_name: string
  avatar_url: string | null
  email: string
  role: 'user' | 'admin'
}

export const profileQueryKeys = {
  all: ['profiles'] as const,
  byUserId: (userId: string) => [...profileQueryKeys.all, userId] as const,
}

const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, updated_at, full_name, avatar_url, email, role')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export const useProfile = () => {
  const { user } = useAuthUser()
  const userId = user?.id ?? null

  return useQuery({
    queryKey: profileQueryKeys.byUserId(userId ?? ''),
    queryFn: async () => fetchProfile(userId ?? ''),
    enabled: Boolean(userId),
  })
}
