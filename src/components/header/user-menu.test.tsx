import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import UserMenu from '@/components/header/user-menu'
import { useAuthUser } from '@/hooks/use-auth-user'
import { useProfile } from '@/hooks/use-profile'

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

vi.mock('@/hooks/use-profile', () => ({
  useProfile: vi.fn(),
}))

vi.mock('@/components/header/theme-toggle', () => ({
  default: () => <button>Toggle dark mode</button>,
}))

const mockedUseAuthUser = vi.mocked(useAuthUser)
const mockedUseProfile = vi.mocked(useProfile)

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseAuthUser.mockReturnValue({
      user: { id: 'user-id' },
      isLoggedIn: true,
      isLoading: false,
    })
    mockedUseProfile.mockReturnValue({
      data: {
        id: 'user-id',
        updated_at: null,
        full_name: 'Sam Rivera',
        avatar_url: null,
        email: 'sam@example.com',
        role: 'user',
      },
    } as ReturnType<typeof useProfile>)
  })

  it('opens a compact menu with the welcome message and theme control', async () => {
    const user = userEvent.setup()
    render(<UserMenu />)

    const trigger = screen.getByRole('button', { name: 'Open user menu' })
    expect(trigger).toBeInTheDocument()
    expect(screen.queryByText('Sam Rivera')).not.toBeInTheDocument()

    await user.click(trigger)

    expect(screen.getByText('Welcome, Sam Rivera')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Toggle dark mode' })
    ).toBeInTheDocument()
    expect(screen.getByText('Theme')).toBeInTheDocument()
  })
})
