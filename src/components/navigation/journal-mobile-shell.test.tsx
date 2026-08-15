import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import JournalMobileShell from '@/components/navigation/journal-mobile-shell'

let pathname = '/dashboard'

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}))

describe('JournalMobileShell', () => {
  beforeEach(() => {
    pathname = '/dashboard'
  })

  it('shows Write as the only Stash toolbar action', () => {
    render(
      <JournalMobileShell>
        <main>Journal content</main>
      </JournalMobileShell>
    )

    const navigation = screen.getByRole('navigation', {
      name: 'Journal navigation',
    })
    const writeAction = within(navigation).getByRole('link', { name: 'Write' })
    expect(writeAction).toHaveAttribute('href', '/write')
    expect(writeAction).toHaveClass('max-w-sm', 'justify-self-center')
    expect(within(navigation).getAllByRole('link')).toHaveLength(1)
    expect(screen.getByText('Journal content').parentElement).toHaveClass(
      'pb-24'
    )
  })

  it('shows Stash and the slug-specific edit action', () => {
    pathname = '/entries/sunday-walk'

    render(<JournalMobileShell>Entry content</JournalMobileShell>)

    const navigation = screen.getByRole('navigation', {
      name: 'Journal entry actions',
    })
    expect(screen.getByRole('link', { name: 'Edit entry' })).toHaveAttribute(
      'href',
      '/entries/sunday-walk/edit'
    )
    expect(
      within(navigation)
        .getAllByRole('link')
        .map((link) => link.textContent)
    ).toEqual(['Stash', 'Edit entry'])
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
