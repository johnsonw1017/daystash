'use client'

import type { RefCallback } from 'react'
import { GripVertical, ImageIcon, List, Plus, Type } from 'lucide-react'
import useBlockInsertion from '@/components/journal-editor/hooks/use-block-insertion'
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
  isReordering?: boolean
}

const BlockMenu = ({
  blockId,
  dragHandleRef,
  isReordering = false,
}: BlockMenuProps) => {
  const { insertImage, insertList, insertText } = useBlockInsertion(blockId)

  return (
    <div
      className={cn(
        'mb-1 items-center gap-1 lg:absolute lg:top-0 lg:-left-20 lg:mb-0 lg:flex',
        isReordering ? 'flex' : 'hidden'
      )}
    >
      <button
        ref={dragHandleRef}
        type="button"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
          'cursor-grab transition-opacity active:cursor-grabbing lg:opacity-0 lg:group-hover:opacity-100',
          isReordering ? 'size-11 lg:size-8' : 'hidden lg:inline-flex'
        )}
        aria-label="Reorder block"
      >
        <GripVertical className="size-5 lg:size-4" />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="hidden opacity-0 transition-opacity lg:inline-flex lg:group-hover:opacity-100"
            aria-label="Open block tools"
          >
            <Plus />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="right" className="min-w-36">
          <DropdownMenuItem onSelect={insertText}>
            <Type />
            <span>Text</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={insertList}>
            <List />
            <span>List</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={insertImage}
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
