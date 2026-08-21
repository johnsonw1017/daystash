import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppShell from '@/components/app-shell/app-shell'
import { useAuthUser } from '@/hooks/use-auth-user'
import { createAuthUserState } from '@/lib/atoms/auth'
import { createTestUser } from '@/test/mocks/types'

let pathname = '/dashboard'

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}))

vi.mock('@/hooks/use-auth-user', () => ({
  useAuthUser: vi.fn(),
}))

vi.mock('@/components/app-shell/app-sidebar', () => ({
  default: () => <aside aria-label="App sidebar" />,
}))

const mockedUseAuthUser = vi.mocked(useAuthUser)

describe('AppShell', () => {
  beforeEach(() => {
    pathname = '/dashboard'
    mockedUseAuthUser.mockReturnValue(createAuthUserState(null))
  })

  it('keeps the public header when the user is null', () => {
    render(<AppShell>Page content</AppShell>)

    expect(
      screen.queryByRole('complementary', { name: 'App sidebar' })
    ).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute(
      'href',
      '/login?redirectTo=%2Fdashboard'
    )
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })

  it('renders the authenticated sidebar and its toggle', () => {
    mockedUseAuthUser.mockReturnValue(createAuthUserState(createTestUser()))

    render(<AppShell>Page content</AppShell>)

    expect(
      screen.getByRole('complementary', { name: 'App sidebar' })
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: 'Toggle Sidebar' })
    ).toHaveLength(2)
    expect(
      document.querySelector('[data-slot="sidebar-wrapper"]')
    ).toBeInTheDocument()
  })

  it('shows an auth placeholder while the user is loading', () => {
    mockedUseAuthUser.mockReturnValue(createAuthUserState(null, true))

    render(<AppShell>Page content</AppShell>)

    expect(screen.getByLabelText('Loading user')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Login' })
    ).not.toBeInTheDocument()
  })
})
