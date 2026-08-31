import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppSidebar from '@/components/app-shell/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { createTestProfile } from '@/test/mocks/types'

const { mockedPathname } = vi.hoisted(() => ({
  mockedPathname: { value: '/dashboard' },
}))

vi.mock('next/navigation', () => ({
  usePathname: () => mockedPathname.value,
  useRouter: () => ({ replace: vi.fn() }),
}))

vi.mock('@/hooks/use-auth', () => ({
  useRefreshAuth: () => vi.fn(),
}))

describe('AppSidebar', () => {
  beforeEach(() => {
    mockedPathname.value = '/dashboard'
  })

  it('renders route-aware navigation and a static brand lockup', () => {
    render(
      <SidebarProvider defaultOpen>
        <AppSidebar
          isLoading={false}
          isLoggedIn
          profile={createTestProfile()}
        />
      </SidebarProvider>
    )

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      '/'
    )
    expect(screen.getByRole('link', { name: 'Write' })).toHaveAttribute(
      'href',
      '/write'
    )
    expect(screen.getByRole('link', { name: 'Search' })).toHaveAttribute(
      'href',
      '/search'
    )
    expect(screen.getByRole('link', { name: 'Stash' })).toHaveAttribute(
      'data-active',
      'true'
    )
    expect(
      screen.getAllByRole('link').map((link) => link.textContent)
    ).toEqual(['Home', 'Stash', 'Write', 'Search'])
    expect(screen.getByText('Daystash').closest('a')).toBeNull()
    expect(screen.getByText('Daystash').closest('button')).toBeNull()
    expect(document.querySelector('[data-slot="sidebar-rail"]')).toBeNull()
  })

  it('marks Search active on the search page', () => {
    mockedPathname.value = '/search'

    render(
      <SidebarProvider defaultOpen>
        <AppSidebar
          isLoading={false}
          isLoggedIn
          profile={createTestProfile()}
        />
      </SidebarProvider>
    )

    expect(screen.getByRole('link', { name: 'Search' })).toHaveAttribute(
      'data-active',
      'true'
    )
  })

  it('renders matched sidebar skeletons while auth is loading', () => {
    render(
      <SidebarProvider defaultOpen>
        <AppSidebar isLoading isLoggedIn={false} profile={null} />
      </SidebarProvider>
    )

    expect(screen.getAllByLabelText('Loading account')).toHaveLength(1)
    expect(screen.getByLabelText('Loading appearance')).toBeInTheDocument()
    expect(
      document.querySelectorAll('[data-sidebar="menu-skeleton"]')
    ).toHaveLength(4)
  })

  it('uses the sidebar footer as a login action when logged out', () => {
    render(
      <SidebarProvider defaultOpen>
        <AppSidebar isLoading={false} isLoggedIn={false} profile={null} />
      </SidebarProvider>
    )

    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute(
      'href',
      '/login?redirectTo=%2Fdashboard'
    )
  })
})
