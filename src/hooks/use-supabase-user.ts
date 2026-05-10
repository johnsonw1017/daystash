'use client'

import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import supabase from '@/lib/supabase/client'

type UseSupabaseUserResult = {
  user: User | null
  isLoggedIn: boolean
  isLoading: boolean
}

export function useSupabaseUser(): UseSupabaseUserResult {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!isMounted) return
      setUser(currentUser)
      setIsLoading(false)
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return useMemo(
    () => ({
      user,
      isLoggedIn: Boolean(user),
      isLoading,
    }),
    [user, isLoading]
  )
}
