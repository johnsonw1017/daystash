'use client'

import { useMemo } from 'react'
import type { User } from '@supabase/supabase-js'
import { atom, useAtomValue, useSetAtom } from 'jotai'
import { atomWithQuery } from 'jotai-tanstack-query'
import supabase from '@/lib/supabase/client'

type UserResult = {
  user: User | null
  isLoggedIn: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
}

const fetchSupabaseUser = async (): Promise<User | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

const authUserAtom = atom<User | null | undefined>(undefined)

authUserAtom.onMount = (setAtom) => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setAtom(session?.user ?? null)
  })

  return () => subscription.unsubscribe()
}

const supabaseUserQueryAtom = atomWithQuery((get) => ({
  queryKey: ['supabase-user'],
  queryFn: fetchSupabaseUser,
  enabled: get(authUserAtom) === undefined,
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
}))

const supabaseUserStateAtom = atom((get) => {
  const authUser = get(authUserAtom)
  const query = get(supabaseUserQueryAtom)

  const user = authUser !== undefined ? authUser : (query.data ?? null)
  const isLoading = authUser === undefined && query.isPending

  return {
    user,
    isLoading,
  }
})

export const useSupabaseUser = (): UserResult => {
  const { user, isLoading } = useAtomValue(supabaseUserStateAtom)
  const setUser = useSetAtom(authUserAtom)

  return useMemo(
    () => ({
      user,
      isLoggedIn: Boolean(user),
      isLoading,
      setUser,
    }),
    [isLoading, setUser, user]
  )
}
