'use client'

import { useState } from 'react'
import QRCode from 'react-qr-code'
import { ImageIcon, MonitorSmartphone, Smartphone, Upload } from 'lucide-react'
import useImageDialog from '@/components/journal-editor/hooks/use-image-dialog'
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

const ImageDialog = () => {
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)
  const {
    closeDialog,
    dialogState,
    isCreatingMobileSession,
    isUploadingImages,
    remainingImageSlots,
    setPendingFiles,
    setUploadMode,
    uploadImages,
    uploadInputId,
  } = useImageDialog()

  if (!dialogState.isOpen) return null

  const isPhoneMode = dialogState.mode === 'phone'
  const mobileUploadUrl =
    typeof window === 'undefined' || !dialogState.mobileSession
      ? ''
      : `${window.location.origin}/mobile-upload/${dialogState.mobileSession.token}`

  return (
    <Dialog open onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {dialogState.targetBlockId
              ? 'Add images to carousel'
              : 'Add images'}
          </DialogTitle>
          <DialogDescription>
            {dialogState.targetBlockId ? (
              `Add up to ${remainingImageSlots} more image${remainingImageSlots === 1 ? '' : 's'} to this carousel.`
            ) : (
              <>
                <span className="sm:hidden">
                  Add a new image block from this device.
                </span>
                <span className="hidden sm:inline">
                  Add a new image block from this device or stage images from
                  your phone.
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant={isPhoneMode ? 'outline' : 'default'}
            onClick={() => void setUploadMode('device')}
          >
            <MonitorSmartphone />
            This device
          </Button>
          <Button
            type="button"
            variant={isPhoneMode ? 'default' : 'outline'}
            className="hidden sm:inline-flex"
            onClick={() => void setUploadMode('phone')}
          >
            <Smartphone />
            Phone QR
          </Button>
        </div>

        {!isPhoneMode ? (
          <>
            <Label
              htmlFor={uploadInputId}
              className={cn(
                'flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed p-4 text-center transition-colors',
                isDraggingFiles
                  ? 'border-foreground bg-muted/60'
                  : 'border-border'
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

                const droppedFiles = Array.from(
                  event.dataTransfer.files
                ).filter((file) => file.type.startsWith('image/'))

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

            {dialogState.pendingFiles.length > 0 && (
              <div className="mt-1 max-h-32 space-y-2 overflow-y-auto pr-1">
                {dialogState.pendingFiles.map((file) => (
                  <div
                    key={`${file.name}-${file.size}`}
                    className="bg-muted/40 text-muted-foreground truncate rounded-md px-3 py-2 text-sm"
                    title={file.name}
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
                disabled={
                  isUploadingImages ||
                  dialogState.pendingFiles.length === 0 ||
                  remainingImageSlots === 0
                }
              >
                <ImageIcon />
                {isUploadingImages ? 'Uploading...' : 'Upload images'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="hidden sm:contents">
            <div className="bg-muted flex min-h-72 flex-col items-center justify-center gap-4 rounded-md border p-6">
              {dialogState.mobileSession ? (
                <>
                  <div className="rounded-md bg-white p-3">
                    <QRCode value={mobileUploadUrl} size={180} />
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-sm font-medium">
                      Scan to upload from your phone
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Images will appear here as staged uploads and save with
                      the journal.
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-2 text-center">
                  <p className="text-sm font-medium">
                    {isCreatingMobileSession
                      ? 'Starting phone upload...'
                      : 'Start a phone upload session'}
                  </p>
                  {!isCreatingMobileSession && (
                    <Button
                      type="button"
                      onClick={() => void setUploadMode('phone')}
                    >
                      Retry
                    </Button>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ImageDialog
