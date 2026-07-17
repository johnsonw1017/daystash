import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import HeaderControls from '@/components/header/header-controls'

vi.mock('@/components/header/user-menu', () => ({
  default: () => <button>User menu</button>,
}))

describe('HeaderControls', () => {
  it('renders the user menu', () => {
    render(<HeaderControls />)

    expect(
      screen.getByRole('button', { name: /user menu/i })
    ).toBeInTheDocument()
  })
})
