import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTheme } from 'next-themes'
import ThemeToggle from '@/components/header/theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu'

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}))

const mockedUseTheme = vi.mocked(useTheme)

const renderThemeToggle = () =>
  render(
    <DropdownMenu open>
      <DropdownMenuContent>
        <ThemeToggle />
      </DropdownMenuContent>
    </DropdownMenu>
  )

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the icon toggle as a keyboard-navigable menu item', () => {
    mockedUseTheme.mockReturnValue({
      resolvedTheme: 'light',
      setTheme: vi.fn(),
      themes: [],
    })

    renderThemeToggle()

    expect(
      screen.getByRole('menuitem', { name: /toggle dark mode/i })
    ).toBeInTheDocument()
    expect(screen.queryByText(/theme|dark mode/i)).not.toBeInTheDocument()
  })

  it('switches to dark mode when toggled on', async () => {
    const setTheme = vi.fn()
    mockedUseTheme.mockReturnValue({
      resolvedTheme: 'light',
      setTheme,
      themes: [],
    })

    renderThemeToggle()
    await userEvent.click(
      screen.getByRole('menuitem', { name: /toggle dark mode/i })
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

    renderThemeToggle()
    await userEvent.click(
      screen.getByRole('menuitem', { name: /toggle dark mode/i })
    )

    expect(setTheme).toHaveBeenCalledWith('light')
  })
})
