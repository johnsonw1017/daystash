'use client'

import { ImageIcon, Upload } from 'lucide-react'
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

type ImageUploadDialogProps = {
  isOpen: boolean
  pendingFiles: File[]
  uploadInputId: string
  onOpenChange: (open: boolean) => void
  onFilesChange: (files: File[]) => void
  onUpload: () => void | Promise<void>
}

const ImageUploadDialog = ({
  isOpen,
  pendingFiles,
  uploadInputId,
  onOpenChange,
  onFilesChange,
  onUpload,
}: ImageUploadDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add images</DialogTitle>
          <DialogDescription>
            Upload one or more images into a new image block.
          </DialogDescription>
        </DialogHeader>

        <Label
          htmlFor={uploadInputId}
          className="flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed p-4 text-center"
        >
          <Upload className="text-muted-foreground" />
          <span className="text-sm">Drag and drop or browse your files</span>
          <Input
            id={uploadInputId}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => {
              onFilesChange(Array.from(event.target.files ?? []))
            }}
          />
        </Label>

        {pendingFiles.length > 0 && (
          <div className="mt-1 space-y-2">
            {pendingFiles.map((file) => (
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
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void onUpload()}
            disabled={pendingFiles.length === 0}
          >
            <ImageIcon />
            Upload images
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ImageUploadDialog
