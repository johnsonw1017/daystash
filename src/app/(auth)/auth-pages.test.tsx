import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { redirect } from 'next/navigation'
import LoginPage from '@/app/(auth)/login/page'
import RegisterPage from '@/app/(auth)/register/page'
import VerifyEmailPage from '@/app/(auth)/verify-email/page'
import { DEFAULT_POST_LOGIN_REDIRECT } from '@/lib/auth/redirect'
import { createServerSideClient } from '@/lib/supabase/server'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSideClient: vi.fn(),
}))

vi.mock('@/app/(auth)/login/_components/login-form', () => ({
  default: () => <form aria-label="Login form" />,
}))

vi.mock('@/app/(auth)/register/_components/register-form', () => ({
  default: () => <form aria-label="Register form" />,
}))

const mockedCreateServerSideClient = vi.mocked(createServerSideClient)
const mockedRedirect = vi.mocked(redirect)

const mockAuthUser = (user: { id: string } | null) => {
  mockedCreateServerSideClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
      }),
    },
  })
}

describe('auth pages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the login form when there is no active user', async () => {
    mockAuthUser(null)

    render(await LoginPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByRole('form', { name: /login form/i })).toBeInTheDocument()
    expect(mockedRedirect).not.toHaveBeenCalled()
  })

  it('redirects logged-in users away from login', async () => {
    mockAuthUser({ id: 'user-id' })

    await LoginPage({
      searchParams: Promise.resolve({ redirectTo: '/dashboard' }),
    })

    expect(mockedRedirect).toHaveBeenCalledWith('/dashboard')
  })

  it('renders the register form when there is no active user', async () => {
    mockAuthUser(null)

    render(await RegisterPage())

    expect(screen.getByRole('form', { name: /register form/i })).toBeInTheDocument()
    expect(mockedRedirect).not.toHaveBeenCalled()
  })

  it('redirects logged-in users away from registration', async () => {
    mockAuthUser({ id: 'user-id' })

    await RegisterPage()

    expect(mockedRedirect).toHaveBeenCalledWith(DEFAULT_POST_LOGIN_REDIRECT)
  })

  it('renders the verify email message', () => {
    render(<VerifyEmailPage />)

    expect(screen.getByRole('heading', { name: /verify your email/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /return home/i })).toHaveAttribute('href', '/')
  })
})
