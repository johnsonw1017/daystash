'use server'

import { redirect } from 'next/navigation'
import { createServerSideClient } from '@/lib/supabase/server'
import { getSafeRedirectPath } from '@/lib/auth/redirect'

type CommonObject = Record<string, unknown>

export async function register(formData: CommonObject) {
  const supabase = await createServerSideClient()

  const { error } = await supabase.auth.signUp({
    email: formData.email as string,
    password: formData.password as string,
    options: {
      // Optional: pass extra user metadata
      data: { full_name: formData.full_name as string },
      // Supabase will send a confirmation email to this URL
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) return { error: error.message }

  // User receives a confirmation email; redirect to a pending page
  redirect('/verify-email')
}

export async function login(formData: CommonObject) {
  const supabase = await createServerSideClient()
  const redirectTo = getSafeRedirectPath(formData.redirectTo as string | undefined)

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email as string,
    password: formData.password as string,
  })

  if (error) return { error: error.message }

  redirect(redirectTo)
}

export async function logout() {
  const supabase = await createServerSideClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function forgotPassword(formData: CommonObject) {
  const supabase = await createServerSideClient()

  const { error } = await supabase.auth.resetPasswordForEmail(
    formData.email as string,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/update-password`,
    }
  )

  if (error) return { error: error.message }

  return { success: 'Check your email for a password reset link.' }
}

export async function updatePassword(formData: CommonObject) {
  const supabase = await createServerSideClient()

  const { error } = await supabase.auth.updateUser({
    password: formData.password as string,
  })

  if (error) return { error: error.message }

  redirect('/dashboard')
}
