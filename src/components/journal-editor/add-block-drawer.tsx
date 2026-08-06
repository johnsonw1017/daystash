'use client'

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

  const selectAction = (action: () => void) => {
    onOpenChange(false)
    action()
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="text-left">
            <DrawerTitle>Add below this block</DrawerTitle>
            <DrawerDescription>
              Choose the kind of content you want to add.
            </DrawerDescription>
          </DrawerHeader>
          <div className="grid gap-2 px-4">
            <Button
              type="button"
              variant="outline"
              className="h-14 justify-start px-4"
              onClick={() => selectAction(insertText)}
            >
              <Type className="size-5" />
              Text
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-14 justify-start px-4"
              onClick={() => selectAction(insertList)}
            >
              <List className="size-5" />
              List
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-14 justify-start px-4"
              onClick={() => selectAction(insertImage)}
            >
              <ImageIcon className="size-5" />
              Images
            </Button>
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
