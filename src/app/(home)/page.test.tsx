import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Home from '@/app/(home)/page'

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('always links users to start writing', () => {
    render(<Home />)

    expect(
      screen.getByRole('heading', {
        name: /every day leaves something behind/i,
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /start writing/i })
    ).toHaveAttribute('href', '/write')
  })
})
