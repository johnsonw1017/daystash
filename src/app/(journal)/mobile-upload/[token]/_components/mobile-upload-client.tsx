'use client'

import { useState } from 'react'
import { LoaderCircle, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { uploadImagesToCloudinary } from '@/lib/image-upload'

type MobileUploadClientProps = {
  token: string
  userId: string
}

const mobileUploadInputId = 'mobile-upload-input'

const MobileUploadClient = ({ token, userId }: MobileUploadClientProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedCount, setUploadedCount] = useState(0)

  const handleFilesSelected = async (files: FileList | null) => {
    const imageFiles = Array.from(files ?? []).filter((file) =>
      file.type.startsWith('image/')
    )

    if (!imageFiles.length) return

    setIsUploading(true)

    try {
      let completedCount = 0

      for (const file of imageFiles) {
        const [uploadedImage] = await uploadImagesToCloudinary([file], userId)

        if (!uploadedImage) {
          throw new Error('Cloudinary upload failed')
        }

        const response = await fetch('/api/mobile-upload/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            image: uploadedImage,
          }),
        })

        if (!response.ok) {
          throw new Error('Could not stage image')
        }

        completedCount += 1
        setUploadedCount((currentCount) => currentCount + 1)
      }

      toast.success(
        completedCount === 1
          ? 'Image staged for desktop'
          : `${completedCount} images staged for desktop`
      )
    } catch {
      toast.error('Upload failed before staging completed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Upload to Daystash</h1>
        <p className="text-muted-foreground text-sm">
          Choose photos here. They will appear in your desktop editor as a
          staged image block.
        </p>
      </div>

      <Label
        htmlFor={mobileUploadInputId}
        className="min-h-64 cursor-pointer flex-col justify-center gap-4 rounded-xl border border-dashed p-6 text-center"
      >
        <div className="bg-muted rounded-full p-3">
          {isUploading ? <LoaderCircle className="animate-spin" /> : <Upload />}
        </div>
        <div className="space-y-1">
          <p className="font-medium">
            {isUploading ? 'Uploading images...' : 'Tap to choose images'}
          </p>
          <p className="text-muted-foreground text-sm">
            You can keep this page open and upload more than once.
          </p>
        </div>
        <Input
          id={mobileUploadInputId}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={isUploading}
          onChange={(event) => {
            void handleFilesSelected(event.target.files)
            event.target.value = ''
          }}
        />
      </Label>

      <Button type="button" variant="outline" disabled>
        {uploadedCount === 0
          ? 'No images staged yet'
          : `${uploadedCount} image${uploadedCount === 1 ? '' : 's'} staged`}
      </Button>
    </div>
  )
}

export default MobileUploadClient
