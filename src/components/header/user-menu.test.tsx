import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import UserMenu from '@/components/header/user-menu'
import { useAuthUser } from '@/hooks/use-auth-user'
import { createTestUser } from '@/test/mocks/types'

const replace = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/hooks/use-auth-user', () => ({
  useAuthUser: vi.fn(),
  useRefreshAuthUser: () => vi.fn(),
}))

vi.mock('@/components/header/theme-toggle', () => ({
  default: () => <button>Toggle dark mode</button>,
}))

const mockedUseAuthUser = vi.mocked(useAuthUser)

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseAuthUser.mockReturnValue({
      user: createTestUser(),
      isLoggedIn: true,
      isLoading: false,
    })
  })

  it('renders responsive user menu drawer triggers', () => {
    render(<UserMenu />)

    const triggers = screen.getAllByRole('button', {
      name: 'Open user menu',
    })
    expect(triggers).toHaveLength(2)
    expect(triggers[0].parentElement).toHaveClass('lg:hidden')
    expect(triggers[1].parentElement).toHaveClass('hidden', 'lg:block')
  })
})
