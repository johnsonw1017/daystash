import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppShell from '@/components/app-shell/app-shell'
import { useAuth } from '@/hooks/use-auth'
import { createAuthState } from '@/lib/atoms/auth'
import { createTestProfile } from '@/test/mocks/types'

let pathname = '/dashboard'

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}))

vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/components/app-shell/app-sidebar', () => ({
  default: () => <aside aria-label="App sidebar" />,
}))

const mockedUseAuth = vi.mocked(useAuth)

describe('AppShell', () => {
  beforeEach(() => {
    pathname = '/dashboard'
    mockedUseAuth.mockReturnValue(createAuthState(null))
  })

  it('keeps the desktop sidebar when the user is logged out', () => {
    render(<AppShell>Page content</AppShell>)

    expect(
      screen.getByRole('complementary', { name: 'App sidebar' })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute(
      'href',
      '/login?redirectTo=%2Fdashboard'
    )
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })

  it('renders the authenticated sidebar and its toggle', () => {
    mockedUseAuth.mockReturnValue(
      createAuthState('user-id', createTestProfile())
    )

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
    mockedUseAuth.mockReturnValue(createAuthState(null, null, true))

    render(<AppShell>Page content</AppShell>)

    expect(screen.getByLabelText('Loading user')).toBeInTheDocument()
    expect(
      screen.getByRole('complementary', { name: 'App sidebar' })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Login' })
    ).not.toBeInTheDocument()
  })
})
