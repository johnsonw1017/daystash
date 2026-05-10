import { redirect } from 'next/navigation'
import { createServerSideClient } from '@/lib/supabase/server'
import RegisterForm from './_components/register-form'

const SignUpPage = async () => {
  const supabase = await createServerSideClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return <RegisterForm />
}

export default SignUpPage
