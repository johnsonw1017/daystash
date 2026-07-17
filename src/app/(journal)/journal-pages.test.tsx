import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardPage from '@/app/(journal)/dashboard/page'
import EntryPage from '@/app/(journal)/entries/[slug]/page'
import EntryEditPage from '@/app/(journal)/entries/[slug]/edit/page'
import JournalLayout from '@/app/(journal)/layout'
import WritePage from '@/app/(journal)/write/page'
import { requireAuth } from '@/lib/auth/require-auth'

vi.mock('@/lib/auth/require-auth', () => ({
  requireAuth: vi.fn(),
}))

vi.mock('@/app/(journal)/dashboard/_components/dashboard-journals', () => ({
  default: () => <div>Dashboard journals</div>,
}))

vi.mock('@/components/journal-editor', () => ({
  default: () => <div>Journal editor</div>,
}))

vi.mock('@/app/(journal)/entries/[slug]/_components/entry-view', () => ({
  default: ({ slug }: { slug: string }) => <div>Entry view: {slug}</div>,
}))

vi.mock('@/app/(journal)/entries/[slug]/edit/_components/entry-edit', () => ({
  default: ({ slug }: { slug: string }) => <div>Entry edit: {slug}</div>,
}))

const mockedRequireAuth = vi.mocked(requireAuth)

describe('journal pages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRequireAuth.mockResolvedValue({ id: 'user-id' })
  })

  it('requires auth before rendering the journal layout children', async () => {
    render(
      await JournalLayout({
        children: <div>Protected content</div>,
      })
    )

    expect(mockedRequireAuth).toHaveBeenCalledWith('/dashboard')
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('renders the dashboard page shell', () => {
    render(<DashboardPage />)

    expect(screen.getByText('Dashboard journals')).toBeInTheDocument()
  })

  it('renders the write page shell', () => {
    render(<WritePage />)

    expect(screen.getByText('Journal editor')).toBeInTheDocument()
  })

  it('passes the route slug to the entry view', async () => {
    render(await EntryPage({ params: Promise.resolve({ slug: 'summer-trip' }) }))

    expect(screen.getByText('Entry view: summer-trip')).toBeInTheDocument()
  })

  it('passes the route slug to the entry editor', async () => {
    render(await EntryEditPage({ params: Promise.resolve({ slug: 'summer-trip' }) }))

    expect(screen.getByText('Entry edit: summer-trip')).toBeInTheDocument()
  })
})
