import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DesktopSaveControl from '@/components/journal-editor/desktop-save-control'

const editorState = vi.hoisted(() => ({
  isDirty: true,
  isEditMode: true,
  isSaving: false,
  save: vi.fn(),
}))

vi.mock('@/components/journal-editor/hooks/use-journal-editor', () => ({
  default: () => editorState,
}))

describe('DesktopSaveControl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    editorState.isDirty = true
    editorState.isEditMode = true
    editorState.isSaving = false
  })

  it('saves dirty edited journals with the button or Command-S', async () => {
    const user = userEvent.setup()
    render(<DesktopSaveControl />)

    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(editorState.save).toHaveBeenCalledOnce()

    const event = new KeyboardEvent('keydown', {
      key: 's',
      metaKey: true,
      cancelable: true,
    })
    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(editorState.save).toHaveBeenCalledTimes(2)

    const controlEvent = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      cancelable: true,
    })
    window.dispatchEvent(controlEvent)

    expect(controlEvent.defaultPrevented).toBe(true)
    expect(editorState.save).toHaveBeenCalledTimes(3)
  })

  it('is absent and leaves the browser shortcut alone when nothing is unsaved', () => {
    editorState.isDirty = false
    render(<DesktopSaveControl />)

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      cancelable: true,
    })
    window.dispatchEvent(event)

    expect(
      screen.queryByRole('button', { name: 'Save changes' })
    ).not.toBeInTheDocument()
    expect(event.defaultPrevented).toBe(false)
    expect(editorState.save).not.toHaveBeenCalled()
  })
})
