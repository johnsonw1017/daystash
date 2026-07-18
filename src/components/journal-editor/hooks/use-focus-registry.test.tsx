import { fireEvent, render, screen } from '@testing-library/react'
import { useCallback, useState } from 'react'
import { describe, expect, it } from 'vitest'
import useFocusRegistry, {
  FocusRegistryProvider,
} from '@/components/journal-editor/hooks/use-focus-registry'

const DeferredTextTarget = () => {
  const [isVisible, setIsVisible] = useState(false)
  const { focusTextBlock, registerFocusTarget } = useFocusRegistry()
  const setTargetRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      registerFocusTarget(
        'text-block',
        node ? { element: node, kind: 'textarea' } : null
      )
    },
    [registerFocusTarget]
  )

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsVisible(true)
          focusTextBlock('text-block', 2)
        }}
      >
        Add text block
      </button>
      {isVisible ? <textarea ref={setTargetRef} defaultValue="hello" /> : null}
    </>
  )
}

describe('useFocusRegistry', () => {
  it('focuses a target registered during the same render as a focus request', () => {
    render(
      <FocusRegistryProvider>
        <DeferredTextTarget />
      </FocusRegistryProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Add text block' }))

    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveFocus()
    expect(textarea).toHaveProperty('selectionStart', 2)
    expect(textarea).toHaveProperty('selectionEnd', 2)
  })
})
