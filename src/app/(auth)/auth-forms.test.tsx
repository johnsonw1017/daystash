import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  forgotPassword,
  login,
  register,
  updatePassword,
} from '@/actions/auth'
import ForgotPasswordPage from '@/app/(auth)/forgot-password/page'
import LoginForm from '@/app/(auth)/login/_components/login-form'
import RegisterForm from '@/app/(auth)/register/_components/register-form'
import UpdatePasswordPage from '@/app/(auth)/update-password/page'
import { useRefreshAuthUser } from '@/hooks/use-auth-user'

const replace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'redirectTo' ? '/dashboard' : null),
  }),
}))

vi.mock('@/actions/auth', () => ({
  forgotPassword: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  updatePassword: vi.fn(),
}))

vi.mock('@/hooks/use-auth-user', () => ({
  useRefreshAuthUser: vi.fn(),
}))

const mockedForgotPassword = vi.mocked(forgotPassword)
const mockedLogin = vi.mocked(login)
const mockedRegister = vi.mocked(register)
const mockedUpdatePassword = vi.mocked(updatePassword)
const mockedUseRefreshAuthUser = vi.mocked(useRefreshAuthUser)

describe('auth forms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseRefreshAuthUser.mockReturnValue(vi.fn().mockResolvedValue(undefined))
  })

  it('logs in and redirects to the returned destination', async () => {
    mockedLogin.mockResolvedValue({ success: true, redirectTo: '/dashboard' })

    render(<LoginForm />)

    await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'secret-password')
    await userEvent.click(screen.getByRole('button', { name: /^login$/i }))

    await waitFor(() =>
      expect(mockedLogin).toHaveBeenCalledWith({
        email: 'jane@example.com',
        password: 'secret-password',
        redirectTo: '/dashboard',
      })
    )
    expect(replace).toHaveBeenCalledWith('/dashboard')
  })

  it('shows login server errors', async () => {
    mockedLogin.mockResolvedValue({ error: 'Invalid credentials' })

    render(<LoginForm />)

    await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'wrong-password')
    await userEvent.click(screen.getByRole('button', { name: /^login$/i }))

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
  })

  it('validates registration password confirmation before submitting', async () => {
    render(<RegisterForm />)

    await userEvent.type(screen.getByLabelText(/full name/i), 'Jane Traveller')
    await userEvent.type(screen.getByLabelText(/^email$/i), 'jane@example.com')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'secret-password')
    await userEvent.type(screen.getByLabelText(/verify password/i), 'different-password')
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }))

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
    expect(mockedRegister).not.toHaveBeenCalled()
  })

  it('shows registration server errors', async () => {
    mockedRegister.mockResolvedValue({ error: 'Email already registered' })

    render(<RegisterForm />)

    await userEvent.type(screen.getByLabelText(/full name/i), 'Jane Traveller')
    await userEvent.type(screen.getByLabelText(/^email$/i), 'jane@example.com')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'secret-password')
    await userEvent.type(screen.getByLabelText(/verify password/i), 'secret-password')
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }))

    expect(await screen.findByText('Email already registered')).toBeInTheDocument()
  })

  it('shows the forgot-password success state after submission', async () => {
    mockedForgotPassword.mockResolvedValue({
      success: 'Check your email for a password reset link.',
    })

    render(<ForgotPasswordPage />)

    await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(await screen.findByText('Check your email')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('validates update password confirmation before submitting', async () => {
    render(<UpdatePasswordPage />)

    await userEvent.type(screen.getByLabelText(/^new password$/i), 'secret-password')
    await userEvent.type(screen.getByLabelText(/confirm new password/i), 'different-password')
    await userEvent.click(screen.getByRole('button', { name: /update password/i }))

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
    expect(mockedUpdatePassword).not.toHaveBeenCalled()
  })

  it('shows update password server errors', async () => {
    mockedUpdatePassword.mockResolvedValue({ error: 'Session expired' })

    render(<UpdatePasswordPage />)

    await userEvent.type(screen.getByLabelText(/^new password$/i), 'secret-password')
    await userEvent.type(screen.getByLabelText(/confirm new password/i), 'secret-password')
    await userEvent.click(screen.getByRole('button', { name: /update password/i }))

    expect(await screen.findByText('Session expired')).toBeInTheDocument()
  })
})
