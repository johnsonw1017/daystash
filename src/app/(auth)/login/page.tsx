import { redirect } from 'next/navigation'
import { createServerSideClient } from '@/lib/supabase/server'
import LoginForm from './_components/login-form'
import { getPostLoginRedirectPath } from '@/lib/auth/redirect'

type LoginPageProps = {
  searchParams?: Promise<{
    redirectTo?: string
  }>
}

const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const resolvedSearchParams = await searchParams
  const redirectTo = getPostLoginRedirectPath(resolvedSearchParams?.redirectTo)
  const supabase = await createServerSideClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect(redirectTo)
  }

  return <LoginForm />
}

export default LoginPage
