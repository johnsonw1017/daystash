'use client'

import type { RefCallback } from 'react'
import { useSetAtom } from 'jotai'
import { GripVertical, ImageIcon, Plus, Type } from 'lucide-react'
import { editorDialogStateAtom } from '@/components/journal-editor/atoms'
import useJournalBlocks from '@/components/journal-editor/hooks/use-journal-blocks'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type BlockMenuProps = {
  blockId: string
  dragHandleRef?: RefCallback<HTMLButtonElement>
}

const BlockMenu = ({ blockId, dragHandleRef }: BlockMenuProps) => {
  const setEditorDialogState = useSetAtom(editorDialogStateAtom)
  const { insertBlockBelow } = useJournalBlocks()

  return (
    <div className="flex items-center gap-1">
      <button
        ref={dragHandleRef}
        type="button"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
          'cursor-grab opacity-0 transition-opacity active:cursor-grabbing group-hover:opacity-100'
        )}
        aria-label="Reorder block"
      >
        <GripVertical />
      </button>

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
          <DropdownMenuItem onSelect={() => insertBlockBelow(blockId, 'text')}>
            <Type />
            <span>Text</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setEditorDialogState({
                type: 'image-upload',
                isOpen: true,
                context: {
                  insertBelowBlockId: blockId,
                  pendingFiles: [],
                },
              })
            }}
          >
            <ImageIcon />
            <span>Image</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default BlockMenu
