import { v4 as uuidv4 } from 'uuid'
import type { BlockFocusTarget } from '@/components/journal-editor/types'
import {
  normalizeJournalBlocks,
  type ImageJournalBlock,
  type JournalBlock,
  type JournalImageAsset,
  type ListJournalBlock,
  type TextJournalBlock,
} from '@/lib/journals'

type NewJournalImageAsset = Pick<
  JournalImageAsset,
  'assetId' | 'publicId' | 'width' | 'height'
> & {
  altText?: string | null
}

export const makeTextBlock = (content = ''): TextJournalBlock => ({
  id: uuidv4(),
  type: 'text',
  content,
})

export const makeListBlock = (
  style: ListJournalBlock['style'] = 'bullet',
  items: string[] = ['']
): ListJournalBlock => ({
  id: uuidv4(),
  type: 'list',
  style,
  items,
})

export const makeImageBlock = (
  images: NewJournalImageAsset[]
): ImageJournalBlock => ({
  id: uuidv4(),
  type: 'image',
  caption: '',
  images: images.map((image) => ({
    ...image,
    altText: image.altText ?? null,
  })),
})

export const normalizeEditorBlocks = (blocks: JournalBlock[]) =>
  normalizeJournalBlocks(blocks)

const copyTextareaStyles = (source: HTMLTextAreaElement, target: HTMLDivElement) => {
  const computedStyles = window.getComputedStyle(source)
  const mirroredStyles = [
    'borderBottomWidth',
    'borderLeftWidth',
    'borderRightWidth',
    'borderTopWidth',
    'boxSizing',
    'fontFamily',
    'fontFeatureSettings',
    'fontKerning',
    'fontSize',
    'fontStretch',
    'fontStyle',
    'fontVariant',
    'fontVariantLigatures',
    'fontVariationSettings',
    'fontWeight',
    'letterSpacing',
    'lineHeight',
    'paddingBottom',
    'paddingLeft',
    'paddingRight',
    'paddingTop',
    'tabSize',
    'textIndent',
    'textRendering',
    'textTransform',
    'whiteSpace',
    'wordBreak',
    'wordSpacing',
    'overflowWrap',
  ] as const

  mirroredStyles.forEach((styleName) => {
    target.style[styleName] = computedStyles[styleName]
  })
}

const getTextareaCaretTop = (textarea: HTMLTextAreaElement, position: number) => {
  const mirror = document.createElement('div')
  const beforeCaret = textarea.value.slice(0, position)
  const marker = document.createElement('span')

  copyTextareaStyles(textarea, mirror)
  mirror.style.position = 'absolute'
  mirror.style.visibility = 'hidden'
  mirror.style.pointerEvents = 'none'
  mirror.style.left = '0'
  mirror.style.top = '0'
  mirror.style.width = `${textarea.clientWidth}px`
  mirror.style.overflow = 'hidden'
  mirror.style.whiteSpace = 'pre-wrap'
  mirror.style.wordWrap = 'break-word'

  mirror.textContent = beforeCaret
  marker.textContent = '\u200b'
  mirror.append(marker)
  document.body.append(mirror)

  const caretTop = marker.offsetTop
  mirror.remove()

  return caretTop
}

export const getTextareaLineBoundaryState = (
  textarea: HTMLTextAreaElement,
  selectionStart: number
) => {
  const startTop = getTextareaCaretTop(textarea, 0)
  const caretTop = getTextareaCaretTop(textarea, selectionStart)
  const endTop = getTextareaCaretTop(textarea, textarea.value.length)
  const tolerance = 1

  return {
    isOnFirstLine: Math.abs(caretTop - startTop) <= tolerance,
    isOnLastLine: Math.abs(caretTop - endTop) <= tolerance,
  }
}

export const focusBlockTarget = (
  target: BlockFocusTarget,
  placement: 'start' | 'end'
) => {
  if (target.kind === 'list') {
    const element = target.getElement(placement)

    if (!element) {
      return
    }

    const caretPosition = placement === 'start' ? 0 : element.value.length

    element.focus()
    element.setSelectionRange(caretPosition, caretPosition)
    return
  }

  const { element } = target
  const caretPosition =
    placement === 'start' ? 0 : element.value.length

  element.focus()
  element.setSelectionRange(caretPosition, caretPosition)
}
