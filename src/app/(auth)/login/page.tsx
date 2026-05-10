import { redirect } from 'next/navigation'
import { createServerSideClient } from '@/lib/supabase/server'
import LoginForm from './_components/login-form'

const LoginPage = async () => {
  const supabase = await createServerSideClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return <LoginForm />
}

export default LoginPage
