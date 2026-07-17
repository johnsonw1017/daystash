import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Logo from '@/components/header/logo'

describe('Logo', () => {
  it('links to the home page with the Daystash brand', () => {
    render(<Logo />)

    const link = screen.getByRole('link', { name: /go to home/i })

    expect(link).toHaveAttribute('href', '/')
    expect(screen.getByRole('heading', { name: 'Daystash' })).toBeInTheDocument()
  })
})
