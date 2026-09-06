import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { logout } from '@/actions/auth'
import UserMenu from '@/components/app-shell/user-menu'
import { SidebarProvider } from '@/components/ui/sidebar'
import { createTestProfile } from '@/test/mocks/types'

const refreshAuth = vi.fn()
const replace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}))

vi.mock('@/actions/auth', () => ({
  logout: vi.fn(),
}))

vi.mock('@/hooks/use-auth', () => ({
  useRefreshAuth: () => refreshAuth,
}))

const mockedLogout = vi.mocked(logout)
const profile = createTestProfile()
const openSettings = vi.fn()

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedLogout.mockResolvedValue({ success: true })
  })

  it('shows the authenticated user and only the sign out action', async () => {
    const actor = userEvent.setup()

    render(
      <SidebarProvider defaultOpen>
        <UserMenu onOpenSettings={openSettings} profile={profile} />
      </SidebarProvider>
    )

    expect(screen.getByText('Jamie Doe')).toBeInTheDocument()
    expect(screen.getByText('jamie@example.com')).toBeInTheDocument()
    expect(screen.getByText('JD')).toBeInTheDocument()

    await actor.click(screen.getByRole('button', { name: 'Open user menu' }))

    expect(
      screen.getByRole('menuitem', { name: 'Settings' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('menuitem', { name: 'Sign out' })
    ).toBeInTheDocument()
    expect(screen.getAllByRole('menuitem')).toHaveLength(2)
  })

  it('opens profile settings from the user menu', async () => {
    const actor = userEvent.setup()

    render(
      <SidebarProvider defaultOpen>
        <UserMenu onOpenSettings={openSettings} profile={profile} />
      </SidebarProvider>
    )

    await actor.click(screen.getByRole('button', { name: 'Open user menu' }))
    await actor.click(screen.getByRole('menuitem', { name: 'Settings' }))

    expect(openSettings).toHaveBeenCalledOnce()
  })

  it('signs out and returns to the login page', async () => {
    const actor = userEvent.setup()

    render(
      <SidebarProvider defaultOpen>
        <UserMenu onOpenSettings={openSettings} profile={profile} />
      </SidebarProvider>
    )

    await actor.click(screen.getByRole('button', { name: 'Open user menu' }))
    await actor.click(screen.getByRole('menuitem', { name: 'Sign out' }))

    expect(mockedLogout).toHaveBeenCalledOnce()
    expect(refreshAuth).toHaveBeenCalledOnce()
    expect(replace).toHaveBeenCalledWith('/login')
  })
})
