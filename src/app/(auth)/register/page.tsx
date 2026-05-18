import { redirect } from 'next/navigation'
import { createServerSideClient } from '@/lib/supabase/server'
import RegisterForm from './_components/register-form'
import { DEFAULT_POST_LOGIN_REDIRECT } from '@/lib/auth/redirect'

const SignUpPage = async () => {
  const supabase = await createServerSideClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect(DEFAULT_POST_LOGIN_REDIRECT)
  }

  return <RegisterForm />
}

export default SignUpPage
