import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Home from '@/app/(home)/page'
import { useAuthUser } from '@/hooks/use-auth-user'

vi.mock('@/hooks/use-auth-user', () => ({
  useAuthUser: vi.fn(),
}))

const mockedUseAuthUser = vi.mocked(useAuthUser)

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('always links users to start writing', () => {
    mockedUseAuthUser.mockReturnValue({
      user: null,
      isLoggedIn: false,
      isLoading: false,
    })

    render(<Home />)

    expect(
      screen.getByRole('heading', { name: /every day leaves something behind/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /start writing/i })).toHaveAttribute(
      'href',
      '/write'
    )
    expect(screen.queryByRole('link', { name: /view dashboard/i })).not.toBeInTheDocument()
  })

  it('shows a dashboard link for logged-in users', () => {
    mockedUseAuthUser.mockReturnValue({
      user: { id: 'user-id' },
      isLoggedIn: true,
      isLoading: false,
    })

    render(<Home />)

    expect(screen.getByRole('link', { name: /view dashboard/i })).toHaveAttribute(
      'href',
      '/dashboard'
    )
  })

  it('shows a dashboard loading skeleton while auth state is loading', () => {
    mockedUseAuthUser.mockReturnValue({
      user: null,
      isLoggedIn: false,
      isLoading: true,
    })

    render(<Home />)

    expect(screen.getByLabelText(/loading dashboard/i)).toBeInTheDocument()
  })
})
