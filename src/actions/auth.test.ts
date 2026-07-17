import { beforeEach, describe, expect, it, vi } from 'vitest'
import { redirect } from 'next/navigation'
import {
  forgotPassword,
  login,
  logout,
  register,
  updatePassword,
} from '@/actions/auth'
import { DEFAULT_POST_LOGIN_REDIRECT } from '@/lib/auth/redirect'
import { createServerSideClient } from '@/lib/supabase/server'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSideClient: vi.fn(),
}))

const mockedRedirect = vi.mocked(redirect)
const mockedCreateServerSideClient = vi.mocked(createServerSideClient)

const createSupabaseAuthMock = ({
  forgotPasswordError,
  loginError,
  logoutError,
  registerError,
  updatePasswordError,
}: {
  forgotPasswordError?: { message: string } | null
  loginError?: { message: string } | null
  logoutError?: { message: string } | null
  registerError?: { message: string } | null
  updatePasswordError?: { message: string } | null
} = {}) => {
  const auth = {
    resetPasswordForEmail: vi.fn().mockResolvedValue({
      error: forgotPasswordError ?? null,
    }),
    signInWithPassword: vi.fn().mockResolvedValue({ error: loginError ?? null }),
    signOut: vi.fn().mockResolvedValue({ error: logoutError ?? null }),
    signUp: vi.fn().mockResolvedValue({ error: registerError ?? null }),
    updateUser: vi.fn().mockResolvedValue({ error: updatePasswordError ?? null }),
  }

  mockedCreateServerSideClient.mockResolvedValue({ auth })

  return auth
}

describe('auth actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://daystash.test')
  })

  it('registers users with a profile name and redirects to verify email', async () => {
    const auth = createSupabaseAuthMock()

    await register({
      email: 'jane@example.com',
      password: 'secret-password',
      full_name: 'Jane Traveller',
    })

    expect(auth.signUp).toHaveBeenCalledWith({
      email: 'jane@example.com',
      password: 'secret-password',
      options: {
        data: { full_name: 'Jane Traveller' },
        emailRedirectTo: 'https://daystash.test/auth/callback',
      },
    })
    expect(mockedRedirect).toHaveBeenCalledWith('/verify-email')
  })

  it('returns registration errors instead of redirecting', async () => {
    createSupabaseAuthMock({ registerError: { message: 'Email already registered' } })

    await expect(register({ email: 'jane@example.com' })).resolves.toEqual({
      error: 'Email already registered',
    })
    expect(mockedRedirect).not.toHaveBeenCalled()
  })

  it('logs users in and sanitizes redirect targets', async () => {
    const auth = createSupabaseAuthMock()

    await expect(
      login({
        email: 'jane@example.com',
        password: 'secret-password',
        redirectTo: 'https://example.com',
      })
    ).resolves.toEqual({ success: true, redirectTo: DEFAULT_POST_LOGIN_REDIRECT })

    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'jane@example.com',
      password: 'secret-password',
    })
  })

  it('returns login errors', async () => {
    createSupabaseAuthMock({ loginError: { message: 'Invalid credentials' } })

    await expect(login({ email: 'jane@example.com' })).resolves.toEqual({
      error: 'Invalid credentials',
    })
  })

  it('logs users out', async () => {
    const auth = createSupabaseAuthMock()

    await expect(logout()).resolves.toEqual({ success: true })
    expect(auth.signOut).toHaveBeenCalledOnce()
  })

  it('sends password reset emails with the update-password callback', async () => {
    const auth = createSupabaseAuthMock()

    await expect(forgotPassword({ email: 'jane@example.com' })).resolves.toEqual({
      success: 'Check your email for a password reset link.',
    })
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('jane@example.com', {
      redirectTo: 'https://daystash.test/auth/callback?next=/update-password',
    })
  })

  it('updates passwords and redirects home', async () => {
    const auth = createSupabaseAuthMock()

    await updatePassword({ password: 'new-secret-password' })

    expect(auth.updateUser).toHaveBeenCalledWith({
      password: 'new-secret-password',
    })
    expect(mockedRedirect).toHaveBeenCalledWith(DEFAULT_POST_LOGIN_REDIRECT)
  })
})
