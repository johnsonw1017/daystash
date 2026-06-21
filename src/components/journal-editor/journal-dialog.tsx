'use client'

import { useState } from 'react'
import { ImageIcon, Upload } from 'lucide-react'
import useJournalDialog from '@/components/journal-editor/hooks/use-journal-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const JournalDialog = () => {
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)
  const {
    closeDialog,
    dialogState,
    setPendingFiles,
    uploadImages,
    uploadInputId,
  } = useJournalDialog()

  if (!dialogState.isOpen) return null

  switch (dialogState.type) {
    case 'image-upload':
      return (
        <Dialog
          open={dialogState.isOpen}
          onOpenChange={(open) => !open && closeDialog()}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add images</DialogTitle>
              <DialogDescription>
                Upload one or more images into a new image block.
              </DialogDescription>
            </DialogHeader>

            <Label
              htmlFor={uploadInputId}
              className={cn(
                'flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed p-4 text-center transition-colors',
                isDraggingFiles ? 'border-foreground bg-muted/60' : 'border-border'
              )}
              onDragEnter={(event) => {
                event.preventDefault()
                setIsDraggingFiles(true)
              }}
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'copy'
                setIsDraggingFiles(true)
              }}
              onDragLeave={(event) => {
                event.preventDefault()

                if (event.currentTarget.contains(event.relatedTarget as Node)) {
                  return
                }

                setIsDraggingFiles(false)
              }}
              onDrop={(event) => {
                event.preventDefault()
                setIsDraggingFiles(false)

                const droppedFiles = Array.from(event.dataTransfer.files).filter(
                  (file) => file.type.startsWith('image/')
                )

                setPendingFiles(droppedFiles)
              }}
            >
              <Upload className="text-muted-foreground" />
              <span className="text-sm">
                Drag and drop or browse your files
              </span>
              <Input
                id={uploadInputId}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  setPendingFiles(Array.from(event.target.files ?? []))
                }}
              />
            </Label>

            {dialogState.context.pendingFiles.length > 0 && (
              <div className="mt-1 space-y-2">
                {dialogState.context.pendingFiles.map((file) => (
                  <div
                    key={`${file.name}-${file.size}`}
                    className="text-muted-foreground text-sm"
                  >
                    {file.name}
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void uploadImages()}
                disabled={dialogState.context.pendingFiles.length === 0}
              >
                <ImageIcon />
                Upload images
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )
    default:
      return null
  }
}

export default JournalDialog
