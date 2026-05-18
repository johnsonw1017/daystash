'use client'

import { useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import UserMenu from '@/components/header/user-menu'
import ThemeToggle from '@/components/header/theme-toggle'
import supabase from '@/lib/supabase/client'

const getFirstName = (user: User | null) => {
  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? ''
  return fullName.trim().split(' ').filter(Boolean)[0]
}

const HeaderAuth = () => {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      return {
        isLoggedIn: Boolean(user),
        firstName: getFirstName(user),
      }
    },
  })

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void queryClient.invalidateQueries({ queryKey: ['auth-user'] })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient])

  if (isLoading) {
    return null
  }

  return (
    <div className="flex items-center gap-3">
      <ThemeToggle />
      <UserMenu
        isLoggedIn={data?.isLoggedIn ?? false}
        firstName={data?.firstName ?? ''}
      />
    </div>
  )
}

export default HeaderAuth
