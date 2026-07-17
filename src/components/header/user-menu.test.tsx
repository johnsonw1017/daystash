import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import UserMenu from '@/components/header/user-menu'
import { useAuthUser } from '@/hooks/use-auth-user'

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
      user: { id: 'user-id' },
      isLoggedIn: true,
      isLoading: false,
    })
  })

  it('opens a compact navigation menu with the theme control', async () => {
    const user = userEvent.setup()
    render(<UserMenu />)

    const trigger = screen.getByRole('button', { name: 'Open user menu' })
    expect(trigger).toBeInTheDocument()
    await user.click(trigger)

    expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Toggle dark mode' })
    ).toBeInTheDocument()
  })
})
