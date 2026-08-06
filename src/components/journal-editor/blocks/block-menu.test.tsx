import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import BlockMenu from '@/components/journal-editor/blocks/block-menu'

const insertionActions = vi.hoisted(() => ({
  insertImage: vi.fn(),
  insertList: vi.fn(),
  insertText: vi.fn(),
}))

vi.mock('@/components/journal-editor/hooks/use-block-insertion', () => ({
  default: () => insertionActions,
}))

describe('BlockMenu', () => {
  it('hides the mobile grip until reorder mode is active', () => {
    const { rerender } = render(
      <div className="group">
        <BlockMenu blockId="block-1" />
      </div>
    )

    expect(screen.getByRole('button', { name: 'Reorder block' })).toHaveClass(
      'hidden'
    )

    rerender(
      <div className="group">
        <BlockMenu blockId="block-1" isReordering />
      </div>
    )

    expect(
      screen.getByRole('button', { name: 'Reorder block' })
    ).not.toHaveClass('hidden')
    expect(screen.getByRole('button', { name: 'Reorder block' })).toHaveClass(
      'size-11'
    )
  })

  it('keeps the per-block add menu desktop-only', () => {
    render(
      <div className="group">
        <BlockMenu blockId="block-1" />
      </div>
    )

    expect(
      screen.getByRole('button', { name: 'Open block tools' })
    ).toHaveClass('hidden', 'lg:inline-flex')
  })
})
