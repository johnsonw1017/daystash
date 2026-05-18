import { redirect } from 'next/navigation'
import { createServerSideClient } from '@/lib/supabase/server'

export const requireAuth = async (redirectToPath: string) => {
  const supabase = await createServerSideClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(redirectToPath)}`)
  }

  return user
}
