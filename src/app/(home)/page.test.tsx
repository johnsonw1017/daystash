import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Home from '@/app/(home)/page'
import { useAuth } from '@/hooks/use-auth'
import { createAuthState } from '@/lib/atoms/auth'
import { createTestProfile } from '@/test/mocks/types'

vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('always links users to start writing', () => {
    mockedUseAuth.mockReturnValue(createAuthState(null))

    render(<Home />)

    expect(
      screen.getByRole('heading', {
        name: /every day leaves something behind/i,
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /start writing/i })
    ).toHaveAttribute('href', '/write')
    expect(
      screen.queryByRole('link', { name: /view dashboard/i })
    ).not.toBeInTheDocument()
  })

  it('shows a dashboard link for logged-in users', () => {
    mockedUseAuth.mockReturnValue(
      createAuthState('user-id', createTestProfile())
    )

    render(<Home />)

    expect(
      screen.getByRole('link', { name: /view dashboard/i })
    ).toHaveAttribute('href', '/dashboard')
  })

  it('shows a dashboard loading skeleton while auth state is loading', () => {
    mockedUseAuth.mockReturnValue(createAuthState(null, null, true))

    render(<Home />)

    expect(screen.getByLabelText(/loading dashboard/i)).toBeInTheDocument()
  })
})
