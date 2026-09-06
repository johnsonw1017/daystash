import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Providers from '@/components/providers'

vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}))

vi.mock('@/components/auth/auth-state-sync', () => ({
  default: () => <div data-testid="auth-state-sync" />,
}))

vi.mock('@/components/offline/offline-journal-sync', () => ({
  default: () => <div data-testid="offline-journal-sync" />,
}))

vi.mock('@/components/offline/offline-journal-access', () => ({
  default: () => <div data-testid="offline-journal-access" />,
}))

describe('Providers', () => {
  it('renders app providers, auth sync, and children', () => {
    render(
      <Providers>
        <div>App child</div>
      </Providers>
    )

    expect(screen.getByTestId('theme-provider')).toBeInTheDocument()
    expect(screen.getByTestId('auth-state-sync')).toBeInTheDocument()
    expect(screen.getByTestId('offline-journal-sync')).toBeInTheDocument()
    expect(screen.getByTestId('offline-journal-access')).toBeInTheDocument()
    expect(screen.getByText('App child')).toBeInTheDocument()
  })
})
