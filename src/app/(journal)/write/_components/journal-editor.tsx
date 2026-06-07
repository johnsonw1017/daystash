'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ImageIcon, Plus, Trash2, Upload } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import {
  deleteJournalImage,
  saveJournalDraft,
} from '@/app/(journal)/write/actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { journalQueryKeys } from '@/hooks/use-journals'
import { cloudinaryLoader } from '@/lib/cloudinary'
import type { JournalBlock } from '@/lib/journals'
import supabase from '@/lib/supabase/client'
import { uploadImagesToCloudinary } from '@/lib/image-upload'
import { toast } from 'sonner'

type JournalEditorProps = {
  initialJournalId?: string
  initialTitle?: string
  initialBlocks?: JournalBlock[]
  successMessage?: string
  isEditMode?: boolean
  viewHref?: string
  headerActions?: ReactNode
}

const makeTextBlock = (text = ''): JournalBlock => ({
  id: uuidv4(),
  type: 'text',
  position: 0,
  text_content: text,
})

const normalizeEditorBlocks = (blocks: JournalBlock[]) => {
  const filtered = blocks
    .map((block, index) => {
      if (block.type === 'text') {
        return {
          ...block,
          position: index,
        }
      }

      return {
        ...block,
        position: index,
        images: block.images.map((image, imageIndex) => ({
          ...image,
          position: imageIndex,
        })),
      }
    })
    .filter((block) => (block.type === 'text' ? true : block.images.length > 0))

  return filtered.length ? filtered : [makeTextBlock()]
}

const JournalEditor = ({
  initialJournalId,
  initialTitle = '',
  initialBlocks,
  successMessage = 'Journal saved',
  isEditMode = false,
  viewHref,
  headerActions,
}: JournalEditorProps) => {
  const queryClient = useQueryClient()
  const journalIdRef = useRef<string | undefined>(initialJournalId)
  const [title, setTitle] = useState(initialTitle)
  const [errorMessage, setErrorMessage] = useState('')
  const [blocks, setBlocks] = useState<JournalBlock[]>(
    initialBlocks?.length
      ? normalizeEditorBlocks(initialBlocks)
      : [makeTextBlock()]
  )
  const [activeInsertIndex, setActiveInsertIndex] = useState<number | null>(
    null
  )
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const pendingFocusIndexRef = useRef<number | null>(null)
  const textAreaRefs = useRef<Array<HTMLTextAreaElement | null>>([])
  const uploadInputId = 'journal-image-upload'

  const sortedBlocks = useMemo(
    () => [...blocks].sort((a, b) => a.position - b.position),
    [blocks]
  )

  useEffect(() => {
    if (pendingFocusIndexRef.current === null) return

    const target = textAreaRefs.current[pendingFocusIndexRef.current]
    if (!target) return

    target.focus()
    const length = target.value.length
    target.setSelectionRange(length, length)
    pendingFocusIndexRef.current = null
  }, [sortedBlocks])

  const saveMutation = useMutation({
    mutationFn: async (inputBlocks: JournalBlock[]) => {
      return saveJournalDraft({
        journalId: journalIdRef.current,
        title,
        blocks: normalizeEditorBlocks(inputBlocks),
      })
    },
    onSuccess: (response) => {
      journalIdRef.current = response.journalId
      void queryClient.invalidateQueries({ queryKey: journalQueryKeys.all })
      toast.success(successMessage)
    },
    onError: () => {
      setErrorMessage('Could not save. Try again.')
      toast.error('Could not save journal')
    },
  })

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => deleteJournalImage({ imageId }),
    onError: () => {
      toast.error('Could not delete image')
    },
  })

  const reindexBlocks = (nextBlocks: JournalBlock[]) => {
    return nextBlocks.map((block, index) => ({ ...block, position: index }))
  }

  const openUploadDialog = (insertBelowIndex: number) => {
    setActiveInsertIndex(insertBelowIndex)
    setPendingFiles([])
    setIsUploadDialogOpen(true)
  }

  const handleAddTextBlockBelow = (index: number) => {
    setBlocks((currentBlocks) => {
      const nextBlocks = [...currentBlocks]
      nextBlocks.splice(index + 1, 0, makeTextBlock())
      return reindexBlocks(nextBlocks)
    })
    pendingFocusIndexRef.current = index + 1
  }

  const updateTextBlock = (index: number, value: string) => {
    setBlocks((currentBlocks) => {
      const nextBlocks = [...currentBlocks]
      const block = nextBlocks[index]
      if (!block || block.type !== 'text') return currentBlocks
      nextBlocks[index] = { ...block, text_content: value }
      return nextBlocks
    })
  }

  const updateImageCaption = (index: number, value: string) => {
    setBlocks((currentBlocks) => {
      const nextBlocks = [...currentBlocks]
      const block = nextBlocks[index]
      if (!block || block.type !== 'image') return currentBlocks
      nextBlocks[index] = { ...block, caption: value }
      return nextBlocks
    })
  }

  const handleTextKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    index: number
  ) => {
    const currentBlock = sortedBlocks[index]

    if (
      event.key === 'Backspace' &&
      currentBlock?.type === 'text' &&
      currentBlock.text_content.trim().length === 0 &&
      sortedBlocks.length > 1
    ) {
      event.preventDefault()
      setBlocks((currentBlocks) => {
        const nextBlocks = currentBlocks.filter(
          (_, blockIndex) => blockIndex !== index
        )
        return reindexBlocks(nextBlocks)
      })
      return
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleAddTextBlockBelow(index)
    }
  }

  const handleImageBlockKeyDown = (
    event: React.KeyboardEvent<HTMLElement>,
    index: number
  ) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleAddTextBlockBelow(index)
    }
  }

  const handleUpload = async () => {
    if (activeInsertIndex === null || pendingFiles.length === 0) {
      return
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      toast.error('Please log in again to upload images')
      return
    }

    try {
      const uploadedImages = await uploadImagesToCloudinary(
        pendingFiles,
        user.id
      )

      setBlocks((currentBlocks) => {
        const nextBlocks =
          currentBlocks.length === 1 &&
          currentBlocks[0]?.type === 'text' &&
          currentBlocks[0].text_content.trim().length === 0
            ? []
            : [...currentBlocks]
        const imageBlock: JournalBlock = {
          id: uuidv4(),
          type: 'image',
          position: 0,
          caption: '',
          images: uploadedImages.map((image, imageIndex) => ({
            ...image,
            position: imageIndex,
            alt_text: null,
          })),
        }

        nextBlocks.splice(activeInsertIndex + 1, 0, imageBlock)
        return reindexBlocks(nextBlocks)
      })

      setPendingFiles([])
      setIsUploadDialogOpen(false)
      setActiveInsertIndex(null)
      toast.success('Image block added')
    } catch {
      toast.error('Image upload failed')
    }
  }

  const removeImage = async (blockIndex: number, imageIndex: number) => {
    const block = sortedBlocks[blockIndex]
    if (!block || block.type !== 'image') return

    const imageToRemove = block.images[imageIndex]
    if (!imageToRemove) return

    if (imageToRemove.id) {
      await deleteImageMutation.mutateAsync(imageToRemove.id)
    }

    setBlocks((currentBlocks) => {
      const nextBlocks = [...currentBlocks]
      const currentBlock = nextBlocks[blockIndex]
      if (!currentBlock || currentBlock.type !== 'image') return currentBlocks

      const nextImages = currentBlock.images
        .filter((_, idx) => idx !== imageIndex)
        .map((image, idx) => ({ ...image, position: idx }))

      if (!nextImages.length) {
        nextBlocks.splice(blockIndex, 1)
        return reindexBlocks(nextBlocks)
      }

      nextBlocks[blockIndex] = {
        ...currentBlock,
        images: nextImages,
      }

      return nextBlocks
    })
  }

  const handleSave = () => {
    setErrorMessage('')
    saveMutation.mutate(sortedBlocks)
  }

  return (
    <section className="mx-auto flex w-full max-w-[800px] flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            className="placeholder:text-muted-foreground h-14 overflow-hidden border-0 bg-transparent px-0 py-0 font-serif text-3xl leading-tight font-semibold shadow-none focus-visible:ring-0 md:h-16 md:text-4xl"
          />
          <div className="flex items-center gap-2">
            {isEditMode && viewHref && (
              <Button variant="outline" asChild>
                <Link href={viewHref}>View entry</Link>
              </Button>
            )}
            <Button
              type="button"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending
                ? 'Saving...'
                : isEditMode
                  ? 'Save changes'
                  : 'Save'}
            </Button>
            {headerActions}
          </div>
        </div>
        {isEditMode && <Badge variant="secondary">Editing</Badge>}
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        {sortedBlocks.map((block, index) => (
          <div
            key={block.id ?? `${block.type}-${index}`}
            className="group relative overflow-visible"
          >
            <div className="absolute top-2 -left-10">
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
                <DropdownMenuContent
                  align="start"
                  side="right"
                  className="min-w-36"
                >
                  <DropdownMenuItem onSelect={() => openUploadDialog(index)}>
                    <ImageIcon />
                    <span>Image</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {block.type === 'text' ? (
              <Textarea
                ref={(node) => {
                  textAreaRefs.current[index] = node
                }}
                value={block.text_content}
                onChange={(event) => updateTextBlock(index, event.target.value)}
                onKeyDown={(event) => handleTextKeyDown(event, index)}
                placeholder={
                  sortedBlocks.length === 1 &&
                  block.text_content.trim().length === 0
                    ? 'Start writing...'
                    : undefined
                }
                className="placeholder:text-muted-foreground min-h-0 resize-none border-0 bg-transparent px-0 py-0 font-serif text-xl! leading-relaxed shadow-none focus-visible:ring-0"
              />
            ) : (
              <div className="space-y-3">
                {block.images.length > 1 ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {block.images.map((image, imageIndex) => (
                      <div
                        key={image.id ?? image.cloudinary_public_id}
                        className="relative overflow-hidden rounded-md border"
                      >
                        <Image
                          loader={cloudinaryLoader}
                          src={image.cloudinary_public_id}
                          alt={image.alt_text || 'Journal image'}
                          width={image.width}
                          height={image.height}
                          className="h-auto w-full object-contain"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon-xs"
                          className="absolute top-2 right-2"
                          onClick={() => void removeImage(index, imageIndex)}
                          aria-label="Delete image"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : block.images[0] ? (
                  <div className="relative overflow-hidden rounded-md border">
                    <Image
                      loader={cloudinaryLoader}
                      src={block.images[0].cloudinary_public_id}
                      alt={block.images[0].alt_text || 'Journal image'}
                      width={block.images[0].width}
                      height={block.images[0].height}
                      className="h-auto w-full object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-xs"
                      className="absolute top-2 right-2"
                      onClick={() => void removeImage(index, 0)}
                      aria-label="Delete image"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ) : null}

                <Input
                  value={block.caption ?? ''}
                  onChange={(event) =>
                    updateImageCaption(index, event.target.value)
                  }
                  onKeyDown={(event) => handleImageBlockKeyDown(event, index)}
                  placeholder="Add a caption (optional)"
                  className="text-sm"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog
        open={isUploadDialogOpen}
        onOpenChange={(open) => {
          setIsUploadDialogOpen(open)
          if (!open) {
            setPendingFiles([])
            setActiveInsertIndex(null)
          }
        }}
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
                const fileList = Array.from(event.target.files ?? [])
                setPendingFiles(fileList)
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
              onClick={() => setIsUploadDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleUpload()}
              disabled={pendingFiles.length === 0}
            >
              <ImageIcon />
              Upload images
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default JournalEditor
