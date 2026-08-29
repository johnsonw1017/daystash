import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import JournalMobileShell from '@/components/navigation/journal-mobile-shell'

let pathname = '/dashboard'

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}))

vi.mock('@/components/navigation/mobile-calendar-action', () => ({
  default: () => <button type="button">Calendar</button>,
}))

describe('JournalMobileShell', () => {
  beforeEach(() => {
    pathname = '/dashboard'
  })

  it('shows Calendar, Search, and Write actions in the Stash toolbar', () => {
    render(
      <JournalMobileShell>
        <main>Journal content</main>
      </JournalMobileShell>
    )

    const navigation = screen.getByRole('navigation', {
      name: 'Journal navigation',
    })
    const writeAction = within(navigation).getByRole('link', { name: 'Write' })
    expect(
      within(navigation).getByRole('button', { name: 'Calendar' })
    ).toBeInTheDocument()
    expect(
      within(navigation).getByRole('link', { name: 'Search' })
    ).toHaveAttribute('href', '/search')
    expect(writeAction).toHaveAttribute('href', '/write')
    expect(writeAction).toHaveClass('justify-self-center')
    expect(within(navigation).getAllByRole('link')).toHaveLength(2)
    expect(screen.getByText('Journal content').parentElement).toHaveClass(
      'pb-24'
    )
  })

  it('shows Stash, active Search, and Write actions on the search page', () => {
    pathname = '/search'

    render(<JournalMobileShell>Search content</JournalMobileShell>)

    const navigation = screen.getByRole('navigation', {
      name: 'Search navigation',
    })
    expect(
      within(navigation).getByRole('link', { name: 'Stash' })
    ).toHaveAttribute('href', '/dashboard')
    expect(
      within(navigation).getByRole('link', { name: 'Search' })
    ).toHaveAttribute('aria-current', 'page')
    expect(
      within(navigation).getByRole('link', { name: 'Write' })
    ).toHaveAttribute('href', '/write')
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
