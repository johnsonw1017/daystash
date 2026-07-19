import { describe, expect, it, vi } from 'vitest'
import { v4 as uuidv4 } from 'uuid'
import type { BlockFocusTarget } from '@/components/journal-editor/types'
import {
  focusBlockTarget,
  getTextareaLineBoundaryState,
  makeImageBlock,
  makeListBlock,
  makeTextBlock,
  normalizeEditorBlocks,
} from '@/components/journal-editor/utils'

vi.mock('uuid', () => ({
  v4: vi.fn(),
}))

const mockedUuid = vi.mocked(uuidv4 as () => string)

describe('journal editor block factories', () => {
  it('creates text blocks with generated ids', () => {
    mockedUuid.mockReturnValue('text-block-id')

    expect(makeTextBlock('Hello')).toEqual({
      id: 'text-block-id',
      type: 'text',
      content: 'Hello',
    })
  })

  it('creates list blocks with default values', () => {
    mockedUuid.mockReturnValue('list-block-id')

    expect(makeListBlock()).toEqual({
      id: 'list-block-id',
      type: 'list',
      style: 'bullet',
      items: [''],
    })
  })

  it('creates image blocks and normalizes missing alt text to null', () => {
    mockedUuid.mockReturnValue('image-block-id')

    expect(
      makeImageBlock([
        {
          assetId: 'asset-1',
          publicId: 'journal/image',
          width: 1200,
          height: 900,
        },
      ])
    ).toEqual({
      id: 'image-block-id',
      type: 'image',
      caption: '',
      images: [
        {
          assetId: 'asset-1',
          publicId: 'journal/image',
          width: 1200,
          height: 900,
          altText: null,
          isStarred: false,
        },
      ],
    })
  })
})

describe('normalizeEditorBlocks', () => {
  it('uses journal block normalization for editor state', () => {
    expect(
      normalizeEditorBlocks([
        { id: 'empty', type: 'text', content: ' ' },
        { id: 'text-1', type: 'text', content: 'Daily note' },
      ])
    ).toEqual([{ id: 'text-1', type: 'text', content: 'Daily note' }])
  })
})

describe('focusBlockTarget', () => {
  it('focuses a textarea target at the requested placement', () => {
    const textarea = document.createElement('textarea')
    textarea.value = 'Travel notes'
    const focusSpy = vi.spyOn(textarea, 'focus')
    const selectionSpy = vi.spyOn(textarea, 'setSelectionRange')

    focusBlockTarget({ kind: 'textarea', element: textarea }, 'end')

    expect(focusSpy).toHaveBeenCalledOnce()
    expect(selectionSpy).toHaveBeenCalledWith(12, 12)
  })

  it('focuses a list item target when an element exists', () => {
    const textarea = document.createElement('textarea')
    textarea.value = 'Passport'
    const target: BlockFocusTarget = {
      kind: 'list',
      getElement: vi.fn(() => textarea),
    }
    const focusSpy = vi.spyOn(textarea, 'focus')
    const selectionSpy = vi.spyOn(textarea, 'setSelectionRange')

    focusBlockTarget(target, 'start')

    expect(target.getElement).toHaveBeenCalledWith('start')
    expect(focusSpy).toHaveBeenCalledOnce()
    expect(selectionSpy).toHaveBeenCalledWith(0, 0)
  })

  it('does nothing for a missing list target element', () => {
    const target: BlockFocusTarget = {
      kind: 'list',
      getElement: vi.fn(() => null),
    }

    expect(() => focusBlockTarget(target, 'end')).not.toThrow()
    expect(target.getElement).toHaveBeenCalledWith('end')
  })
})

describe('getTextareaLineBoundaryState', () => {
  it('uses a mirrored textarea to determine line boundaries', () => {
    const textarea = document.createElement('textarea')
    textarea.value = 'One line'
    Object.defineProperty(textarea, 'clientWidth', {
      configurable: true,
      value: 200,
    })
    document.body.append(textarea)

    expect(getTextareaLineBoundaryState(textarea, 3)).toEqual({
      isOnFirstLine: true,
      isOnLastLine: true,
    })

    textarea.remove()
  })
})
