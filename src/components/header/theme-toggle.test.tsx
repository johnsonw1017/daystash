import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTheme } from 'next-themes'
import ThemeToggle from '@/components/header/theme-toggle'

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}))

const mockedUseTheme = vi.mocked(useTheme)

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders an unchecked switch without a visible label', () => {
    mockedUseTheme.mockReturnValue({
      resolvedTheme: 'light',
      setTheme: vi.fn(),
      themes: [],
    })

    render(<ThemeToggle />)

    const toggle = screen.getByRole('switch', { name: /toggle dark mode/i })

    expect(toggle).not.toBeChecked()
    expect(toggle).toHaveAttribute('data-size', 'sm')
    expect(screen.queryByText(/theme|dark mode/i)).not.toBeInTheDocument()
  })

  it('switches to dark mode when toggled on', async () => {
    const setTheme = vi.fn()
    mockedUseTheme.mockReturnValue({
      resolvedTheme: 'light',
      setTheme,
      themes: [],
    })

    render(<ThemeToggle />)
    await userEvent.click(
      screen.getByRole('switch', { name: /toggle dark mode/i })
    )

    expect(setTheme).toHaveBeenCalledWith('dark')
  })

  it('switches to light mode when toggled off', async () => {
    const setTheme = vi.fn()
    mockedUseTheme.mockReturnValue({
      resolvedTheme: 'dark',
      setTheme,
      themes: [],
    })

    render(<ThemeToggle />)
    await userEvent.click(
      screen.getByRole('switch', { name: /toggle dark mode/i })
    )

    expect(setTheme).toHaveBeenCalledWith('light')
  })
})
