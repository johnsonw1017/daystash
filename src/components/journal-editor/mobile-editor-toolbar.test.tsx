import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MobileEditorToolbar from '@/components/journal-editor/mobile-editor-toolbar'

const editorState = vi.hoisted(() => ({
  isEditMode: true,
  isSaving: false,
  save: vi.fn(),
  viewHref: '/entries/sunday-walk',
}))

vi.mock('@/components/journal-editor/hooks/use-journal-editor', () => ({
  default: () => editorState,
}))

vi.mock('@/components/journal-editor/add-block-drawer', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div>Add block drawer</div> : null,
}))

describe('MobileEditorToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    editorState.isEditMode = true
    editorState.isSaving = false
    editorState.viewHref = '/entries/sunday-walk'
  })

  it('exposes add, reorder, view, and save actions in edit mode', async () => {
    const user = userEvent.setup()
    const onAddBlockOpenChange = vi.fn()
    const onReorderingChange = vi.fn()

    render(
      <MobileEditorToolbar
        activeBlockId="block-1"
        isAddBlockOpen={false}
        isReordering={false}
        onAddBlockOpenChange={onAddBlockOpenChange}
        onReorderingChange={onReorderingChange}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(onAddBlockOpenChange).toHaveBeenCalledWith(true)

    await user.click(screen.getByRole('button', { name: 'Reorder' }))
    expect(onReorderingChange).toHaveBeenCalledWith(true)

    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute(
      'href',
      '/entries/sunday-walk'
    )

    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(editorState.save).toHaveBeenCalledOnce()
  })

  it('omits View for a new journal and reflects saving state', () => {
    editorState.isEditMode = false
    editorState.isSaving = true
    editorState.viewHref = ''

    render(
      <MobileEditorToolbar
        activeBlockId="block-1"
        isAddBlockOpen={false}
        isReordering
        onAddBlockOpenChange={vi.fn()}
        onReorderingChange={vi.fn()}
      />
    )

    expect(screen.queryByRole('link', { name: 'View' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reorder' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })
})
