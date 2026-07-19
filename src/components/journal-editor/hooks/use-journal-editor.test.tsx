import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'jotai'
import { describe, expect, it } from 'vitest'
import { createJournalBlocksStore } from '@/components/journal-editor/atoms'
import useJournalEditor from '@/components/journal-editor/hooks/use-journal-editor'
import { FocusRegistryProvider } from '@/components/journal-editor/hooks/use-focus-registry'
import type { JournalBlock } from '@/lib/journals'

const initialBlocks: JournalBlock[] = [
  {
    id: 'image-1',
    type: 'image',
    caption: null,
    images: [
      {
        assetId: 'asset-1',
        publicId: 'journal/first',
        width: 1200,
        height: 900,
        altText: null,
      },
    ],
  },
  {
    id: 'image-2',
    type: 'image',
    caption: null,
    images: [
      {
        assetId: 'asset-2',
        publicId: 'journal/second',
        width: 1200,
        height: 900,
        altText: null,
      },
    ],
  },
]

describe('useJournalEditor', () => {
  it('uses the first image as the default thumbnail and switches it when starred', () => {
    const store = createJournalBlocksStore({ initialBlocks })
    const queryClient = new QueryClient()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <FocusRegistryProvider>{children}</FocusRegistryProvider>
        </Provider>
      </QueryClientProvider>
    )
    const { result } = renderHook(() => useJournalEditor(), { wrapper })

    expect(result.current.activeThumbnailAssetId).toBe('asset-1')

    act(() => result.current.toggleImageStar('asset-2'))
    expect(result.current.activeThumbnailAssetId).toBe('asset-2')

    act(() => result.current.toggleImageStar('asset-2'))
    expect(result.current.activeThumbnailAssetId).toBe('asset-1')
  })
})
