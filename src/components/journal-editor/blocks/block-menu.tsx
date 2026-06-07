'use client'

import { ImageIcon, Plus, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type BlockMenuProps = {
  onAddText: () => void
  onAddImage: () => void
}

const BlockMenu = ({ onAddText, onAddImage }: BlockMenuProps) => {
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
        <DropdownMenuItem onSelect={onAddText}>
          <Type />
          <span>Text</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onAddImage}>
          <ImageIcon />
          <span>Image</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default BlockMenu
