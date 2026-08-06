'use client'

import { useRef } from 'react'
import { ImageIcon, List, Type } from 'lucide-react'
import useBlockInsertion from '@/components/journal-editor/hooks/use-block-insertion'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

type AddBlockDrawerProps = {
  blockId: string
  onOpenChange: (open: boolean) => void
  open: boolean
}

const AddBlockDrawer = ({
  blockId,
  onOpenChange,
  open,
}: AddBlockDrawerProps) => {
  const { insertImage, insertList, insertText } = useBlockInsertion(blockId)
  const pendingActionRef = useRef<(() => void) | null>(null)

  const selectAction = (action: () => void) => {
    pendingActionRef.current = action
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      onAnimationEnd={(isOpen) => {
        if (isOpen) return

        const pendingAction = pendingActionRef.current
        pendingActionRef.current = null
        pendingAction?.()
      }}
    >
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="text-left">
            <DrawerTitle>Add below this block</DrawerTitle>
            <DrawerDescription>
              Choose the kind of content you want to add.
            </DrawerDescription>
          </DrawerHeader>
          <div className="grid gap-2 px-4">
            <DrawerClose asChild>
              <Button
                type="button"
                variant="outline"
                className="h-14 justify-start px-4"
                onClick={() => selectAction(insertText)}
              >
                <Type className="size-5" />
                Text
              </Button>
            </DrawerClose>
            <DrawerClose asChild>
              <Button
                type="button"
                variant="outline"
                className="h-14 justify-start px-4"
                onClick={() => selectAction(insertList)}
              >
                <List className="size-5" />
                List
              </Button>
            </DrawerClose>
            <DrawerClose asChild>
              <Button
                type="button"
                variant="outline"
                className="h-14 justify-start px-4"
                onClick={() => selectAction(insertImage)}
              >
                <ImageIcon className="size-5" />
                Images
              </Button>
            </DrawerClose>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default AddBlockDrawer
