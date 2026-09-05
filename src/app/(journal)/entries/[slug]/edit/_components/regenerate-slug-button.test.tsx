import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { regenerateJournalSlug } from '@/app/(journal)/write/actions'
import RegenerateSlugButton from '@/app/(journal)/entries/[slug]/edit/_components/regenerate-slug-button'
import useJournalEditor from '@/components/journal-editor/hooks/use-journal-editor'

const replace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}))

vi.mock('@/components/journal-editor/hooks/use-journal-editor', () => ({
  default: vi.fn(),
}))

vi.mock('@/app/(journal)/write/actions', () => ({
  regenerateJournalSlug: vi.fn(),
}))

const mockedUseJournalEditor = vi.mocked(useJournalEditor)
const mockedRegenerateJournalSlug = vi.mocked(regenerateJournalSlug)
const save = vi.fn()

const renderButton = (slug: string) => {
  const queryClient = new QueryClient()
  const removeQueries = vi.spyOn(queryClient, 'removeQueries')

  render(
    <QueryClientProvider client={queryClient}>
      <RegenerateSlugButton journalId="journal-id" slug={slug} />
    </QueryClientProvider>
  )

  return { removeQueries }
}

describe('RegenerateSlugButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRegenerateJournalSlug.mockResolvedValue({ slug: 'kyoto' })
    mockedUseJournalEditor.mockReturnValue({
      isDirty: false,
      isSaving: false,
      save,
      title: 'Kyoto',
    } as unknown as ReturnType<typeof useJournalEditor>)
  })

  it('is disabled when the slug already matches the current title', () => {
    renderButton('kyoto')

    expect(
      screen.getByRole('button', { name: 'Regenerate journal URL' })
    ).toBeDisabled()
  })

  it('regenerates, clears the old lookup, and replaces the route', async () => {
    const { removeQueries } = renderButton('kyoto--5f52e64b')

    await userEvent.click(
      screen.getByRole('button', { name: 'Regenerate journal URL' })
    )

    expect(
      screen.getByText(/old journal url will no longer work/i)
    ).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: 'Regenerate URL' })
    )

    expect(mockedRegenerateJournalSlug).toHaveBeenCalledWith({
      journalId: 'journal-id',
    })
    expect(removeQueries).toHaveBeenCalledWith({
      queryKey: ['journals', 'slug', 'kyoto--5f52e64b'],
      exact: true,
    })
    expect(replace).toHaveBeenCalledWith('/entries/kyoto/edit')
  })

  it('requires the user to save unsaved changes before regenerating', async () => {
    mockedUseJournalEditor.mockReturnValue({
      isDirty: true,
      isSaving: false,
      save,
      title: 'Kyoto',
    } as unknown as ReturnType<typeof useJournalEditor>)

    renderButton('kyoto--5f52e64b')

    await userEvent.click(
      screen.getByRole('button', { name: 'Regenerate journal URL' })
    )
    expect(screen.getByText('Save changes first')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(save).toHaveBeenCalledOnce()
    expect(mockedRegenerateJournalSlug).not.toHaveBeenCalled()
  })
})
