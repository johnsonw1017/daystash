import type { JournalListBlockItem, ListStyle } from '@/lib/journals'

export type JournalListTreeNode = JournalListBlockItem & {
  children: JournalListTreeNode[]
}

export const buildJournalListTree = (items: JournalListBlockItem[]) => {
  const roots: JournalListTreeNode[] = []
  const stack: JournalListTreeNode[] = []

  items.forEach((item) => {
    const node: JournalListTreeNode = {
      ...item,
      children: [],
    }

    while (stack.length > item.indent) {
      stack.pop()
    }

    const parent = stack[stack.length - 1]

    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }

    stack[item.indent] = node
  })

  return roots
}

export const getJournalListClassName = (style: ListStyle) =>
  style === 'numbered'
    ? 'list-outside list-decimal pl-6 marker:text-base'
    : 'list-outside list-disc pl-6 marker:text-base'
