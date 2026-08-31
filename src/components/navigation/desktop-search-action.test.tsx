import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import DesktopSearchAction from '@/components/navigation/desktop-search-action'

const push = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

describe('DesktopSearchAction', () => {
  it('expands, focuses the search field, and navigates on submit', async () => {
    const user = userEvent.setup()
    render(<DesktopSearchAction />)

    await user.click(screen.getByRole('button', { name: 'Search' }))

    const input = screen.getByRole('searchbox', { name: 'Search journals' })
    expect(input).toHaveFocus()

    await user.type(input, 'morning hike{enter}')

    expect(push).toHaveBeenCalledWith('/search?q=morning%20hike')
  })

  it('collapses on Escape and restores focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<DesktopSearchAction />)

    await user.click(screen.getByRole('button', { name: 'Search' }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Search' })).toHaveFocus()
  })
})
