import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import HeaderControls from '@/components/header/header-controls'

vi.mock('@/components/header/theme-toggle', () => ({
  default: () => <button>Theme toggle</button>,
}))

vi.mock('@/components/header/user-menu', () => ({
  default: () => <button>User menu</button>,
}))

describe('HeaderControls', () => {
  it('renders theme and user controls together', () => {
    render(<HeaderControls />)

    expect(screen.getByRole('button', { name: /theme toggle/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument()
  })
})
