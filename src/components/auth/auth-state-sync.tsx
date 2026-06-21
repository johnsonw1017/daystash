'use client'

import { useEffect } from 'react'
import { useSetAtom } from 'jotai'
import { setAuthUserAtom } from '@/lib/atoms/auth'
import supabase from '@/lib/supabase/client'

const AuthStateSync = () => {
  const refreshAuthUser = useSetAtom(setAuthUserAtom)

  useEffect(() => {
    void refreshAuthUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshAuthUser()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [refreshAuthUser])

  return null
}

export default AuthStateSync
