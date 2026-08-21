import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AppSidebar from '@/components/app-shell/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { createTestUser } from '@/test/mocks/types'

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ replace: vi.fn() }),
}))

vi.mock('@/hooks/use-auth-user', () => ({
  useRefreshAuthUser: () => vi.fn(),
}))

describe('AppSidebar', () => {
  it('renders route-aware navigation and a static brand lockup', () => {
    render(
      <SidebarProvider defaultOpen>
        <AppSidebar user={createTestUser()} />
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
    expect(screen.getByRole('link', { name: 'Stash' })).toHaveAttribute(
      'data-active',
      'true'
    )
    expect(screen.getByText('Daystash').closest('a')).toBeNull()
    expect(screen.getByText('Daystash').closest('button')).toBeNull()
  })
})
