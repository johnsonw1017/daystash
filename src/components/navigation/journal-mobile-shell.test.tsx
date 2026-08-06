import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import JournalMobileShell from '@/components/navigation/journal-mobile-shell'

let pathname = '/dashboard'
const scrollTo = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}))

vi.mock('@/components/header/user-menu', () => ({
  default: ({ trigger }: { trigger?: React.ReactNode }) => trigger,
}))

describe('JournalMobileShell', () => {
  beforeEach(() => {
    pathname = '/dashboard'
    scrollTo.mockReset()
    window.scrollTo = scrollTo
  })

  it('shows equal primary actions and scrolls to the top from Stash', async () => {
    const user = userEvent.setup()
    render(
      <JournalMobileShell>
        <main>Journal content</main>
      </JournalMobileShell>
    )

    expect(
      screen.getByRole('navigation', { name: 'Journal navigation' })
    ).toBeInTheDocument()
    const stashAction = screen.getByRole('button', { name: 'Stash' })
    expect(stashAction).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('link', { name: 'Write' })).toHaveAttribute(
      'href',
      '/write'
    )
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument()
    expect(screen.getByText('Journal content').parentElement).toHaveClass(
      'pb-24'
    )

    await user.click(stashAction)
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })

  it('shows entry actions with a slug-specific edit link', () => {
    pathname = '/entries/sunday-walk'

    render(<JournalMobileShell>Entry content</JournalMobileShell>)

    expect(
      screen.getByRole('navigation', { name: 'Journal entry actions' })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit entry' })).toHaveAttribute(
      'href',
      '/entries/sunday-walk/edit'
    )
  })

  it('reserves toolbar space without duplicating navigation in the editor', () => {
    pathname = '/write'

    render(<JournalMobileShell>Editor content</JournalMobileShell>)

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.getByText('Editor content')).toHaveClass('pb-24')
  })

  it('leaves unrelated journal routes without mobile toolbar spacing', () => {
    pathname = '/mobile-upload/token'

    render(<JournalMobileShell>Upload content</JournalMobileShell>)

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.getByText('Upload content')).not.toHaveClass('pb-24')
  })
})
