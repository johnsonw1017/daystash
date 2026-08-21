'use client'

import { atom } from 'jotai'
import supabase from '@/lib/supabase/client'

export type AuthProfile = {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
}

export type AuthState = {
  userId: string | null
  profile: AuthProfile | null
  isLoggedIn: boolean
  isLoading: boolean
}

export const createAuthState = (
  userId: string | null,
  profile: AuthProfile | null = null,
  isLoading = false
): AuthState => ({
  userId,
  profile,
  isLoggedIn: Boolean(userId),
  isLoading,
})

export const authStateAtom = atom<AuthState>(createAuthState(null, null, true))

export const refreshAuthStateAtom = atom(null, async (_get, set) => {
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  if (claimsError || typeof userId !== 'string') {
    set(authStateAtom, createAuthState(null))
    return
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .eq('id', userId)
    .maybeSingle()

  set(
    authStateAtom,
    createAuthState(userId, (profile as AuthProfile | null) ?? null)
  )
})
