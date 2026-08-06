import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AddBlockDrawer from '@/components/journal-editor/add-block-drawer'

const insertionActions = vi.hoisted(() => ({
  insertImage: vi.fn(),
  insertList: vi.fn(),
  insertText: vi.fn(),
}))

vi.mock('@/components/journal-editor/hooks/use-block-insertion', () => ({
  default: () => insertionActions,
}))

const TestDrawer = () => {
  const [open, setOpen] = useState(true)

  return (
    <AddBlockDrawer
      blockId="block-1"
      open={open}
      onOpenChange={setOpen}
    />
  )
}

describe('AddBlockDrawer', () => {
  it('inserts the selected block after the drawer finishes closing', async () => {
    const user = userEvent.setup()
    render(<TestDrawer />)

    await user.click(screen.getByRole('button', { name: 'Text' }))

    expect(insertionActions.insertText).not.toHaveBeenCalled()
    await waitFor(() => expect(insertionActions.insertText).toHaveBeenCalledOnce())
  })
})
