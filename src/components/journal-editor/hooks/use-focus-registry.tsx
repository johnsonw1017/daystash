'use client'

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import type {
  BlockFocusPlacement,
  BlockFocusTarget,
  FocusRequest,
} from '@/components/journal-editor/types'
import { focusBlockTarget } from '@/components/journal-editor/utils'

type FocusRegistry = {
  focusBlock: (blockId: string, placement: BlockFocusPlacement) => void
  focusTextBlock: (blockId: string, start: number, end?: number) => void
  registerFocusTarget: (
    blockId: string,
    target: BlockFocusTarget | null
  ) => void
}

const FocusRegistryContext = createContext<FocusRegistry | null>(null)

export const FocusRegistryProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const targets = useRef(new Map<string, BlockFocusTarget>())
  const pendingFocus = useRef<FocusRequest | null>(null)
  const [focusVersion, requestFocusCommit] = useReducer(
    (version) => version + 1,
    0
  )

  const registerFocusTarget = useCallback(
    (blockId: string, target: BlockFocusTarget | null) => {
      if (target) {
        targets.current.set(blockId, target)
      } else {
        targets.current.delete(blockId)
      }
    },
    []
  )

  useLayoutEffect(() => {
    const request = pendingFocus.current
    if (!request) return

    const target = targets.current.get(request.blockId)
    if (!target) return

    if ('placement' in request) {
      focusBlockTarget(target, request.placement)
    } else if (target.kind === 'textarea') {
      target.element.focus()
      target.element.setSelectionRange(request.start, request.end)
    }

    pendingFocus.current = null
  }, [focusVersion])

  const focusBlock = useCallback(
    (blockId: string, placement: BlockFocusPlacement) => {
      pendingFocus.current = { blockId, placement }
      requestFocusCommit()
    },
    []
  )

  const focusTextBlock = useCallback(
    (blockId: string, start: number, end = start) => {
      pendingFocus.current = { blockId, start, end }
      requestFocusCommit()
    },
    []
  )

  return (
    <FocusRegistryContext.Provider
      value={{ focusBlock, focusTextBlock, registerFocusTarget }}
    >
      {children}
    </FocusRegistryContext.Provider>
  )
}

const useFocusRegistry = () => {
  const registry = useContext(FocusRegistryContext)

  if (!registry) {
    throw new Error(
      'useFocusRegistry must be used within FocusRegistryProvider'
    )
  }

  return registry
}

export default useFocusRegistry
