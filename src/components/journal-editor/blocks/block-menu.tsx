'use client'

import { useAtomValue, useSetAtom } from 'jotai'
import { ImageIcon, Plus, Type } from 'lucide-react'
import {
  blocksAtom,
  uploadDialogStateAtom,
} from '@/components/journal-editor/atoms'
import useTextBlock from '@/components/journal-editor/hooks/use-text-block'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type BlockMenuProps = {
  blockId: string
}

const BlockMenu = ({ blockId }: BlockMenuProps) => {
  const blocks = useAtomValue(blocksAtom)
  const setUploadDialogState = useSetAtom(uploadDialogStateAtom)
  const { addBelow } = useTextBlock(blockId)
  const blockIndex = blocks.findIndex((block) => block.id === blockId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Open block tools"
        >
          <Plus />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right" className="min-w-36">
        <DropdownMenuItem onSelect={addBelow}>
          <Type />
          <span>Text</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            if (blockIndex !== -1) {
              setUploadDialogState({
                activeInsertIndex: blockIndex,
                isOpen: true,
                pendingFiles: [],
              })
            }
          }}
        >
          <ImageIcon />
          <span>Image</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default BlockMenu
