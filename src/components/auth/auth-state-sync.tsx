'use client'

import { useEffect } from 'react'
import { useSetAtom } from 'jotai'
import { refreshAuthStateAtom } from '@/lib/atoms/auth'
import supabase from '@/lib/supabase/client'

const AuthStateSync = () => {
  const refreshAuth = useSetAtom(refreshAuthStateAtom)

  useEffect(() => {
    void refreshAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshAuth()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [refreshAuth])

  return null
}

export default AuthStateSync
