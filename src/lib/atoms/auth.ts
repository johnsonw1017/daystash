'use client'

import { atom } from 'jotai'
import type { User } from '@supabase/supabase-js'
import supabase from '@/lib/supabase/client'

export type AuthUserState = {
  user: User | null
  isLoggedIn: boolean
  isLoading: boolean
}

export const createAuthUserState = (
  user: User | null,
  isLoading = false
): AuthUserState => ({
  user,
  isLoggedIn: Boolean(user),
  isLoading,
})

export const authUserAtom = atom<AuthUserState>(createAuthUserState(null, true))

export const setAuthUserAtom = atom(
  null,
  async (_get, set) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    set(authUserAtom, createAuthUserState(user))
  }
)
