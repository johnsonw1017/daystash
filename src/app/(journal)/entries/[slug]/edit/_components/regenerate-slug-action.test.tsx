import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RegenerateSlugAction from '@/app/(journal)/entries/[slug]/edit/_components/regenerate-slug-action'
import useJournalEditor from '@/components/journal-editor/hooks/use-journal-editor'

const replace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}))

vi.mock('@/components/journal-editor/hooks/use-journal-editor', () => ({
  default: vi.fn(),
}))

const mockedUseJournalEditor = vi.mocked(useJournalEditor)
const regenerateSlug = vi.fn()

const renderAction = (slug: string) => {
  const queryClient = new QueryClient()
  const removeQueries = vi.spyOn(queryClient, 'removeQueries')

  render(
    <QueryClientProvider client={queryClient}>
      <RegenerateSlugAction slug={slug} />
    </QueryClientProvider>
  )

  return { removeQueries }
}

describe('RegenerateSlugAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    regenerateSlug.mockResolvedValue({ slug: 'kyoto' })
    mockedUseJournalEditor.mockReturnValue({
      isRegeneratingSlug: false,
      isSaving: false,
      regenerateSlug,
      title: 'Kyoto',
    } as unknown as ReturnType<typeof useJournalEditor>)
  })

  it('is disabled when the slug already matches the current title', () => {
    renderAction('kyoto')

    expect(
      screen.getByRole('button', { name: 'Regenerate journal URL' })
    ).toBeDisabled()
  })

  it('saves, regenerates, clears the old lookup, and replaces the route', async () => {
    const { removeQueries } = renderAction('kyoto--5f52e64b')

    await userEvent.click(
      screen.getByRole('button', { name: 'Regenerate journal URL' })
    )

    expect(
      screen.getByText(/current changes will be saved/i)
    ).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: 'Regenerate URL' })
    )

    expect(regenerateSlug).toHaveBeenCalledOnce()
    expect(removeQueries).toHaveBeenCalledWith({
      queryKey: ['journals', 'slug', 'kyoto--5f52e64b'],
      exact: true,
    })
    expect(replace).toHaveBeenCalledWith('/entries/kyoto/edit')
  })
})
