'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { saveJournalDraft } from '@/app/(journal)/write/actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type JournalEditorProps = {
  initialJournalId?: string
  initialTitle?: string
  initialContent?: string
  successMessage?: string
  isEditMode?: boolean
  viewHref?: string
}

type JournalFormValues = {
  title: string
  content: string
}

const JournalEditor = ({
  initialJournalId,
  initialTitle = '',
  initialContent = '',
  successMessage = 'Journal saved',
  isEditMode = false,
  viewHref,
}: JournalEditorProps) => {
  const journalIdRef = useRef<string | undefined>(initialJournalId)
  const [errorMessage, setErrorMessage] = useState('')

  const form = useForm<JournalFormValues>({
    defaultValues: {
      title: initialTitle,
      content: initialContent,
    },
  })

  useEffect(() => {
    journalIdRef.current = initialJournalId
    form.reset({
      title: initialTitle,
      content: initialContent,
    })
  }, [form, initialContent, initialJournalId, initialTitle])

  const saveMutation = useMutation({
    mutationFn: async (values: JournalFormValues) => {
      return saveJournalDraft({
        journalId: journalIdRef.current,
        title: values.title,
        content: values.content,
      })
    },
    onSuccess: (response) => {
      journalIdRef.current = response.journalId
      toast.success(successMessage)
    },
    onError: () => {
      setErrorMessage('Could not save. Try again.')
      toast.error('Could not save journal')
    },
  })

  const handleSave = form.handleSubmit((values) => {
    setErrorMessage('')
    saveMutation.mutate(values)
  })

  return (
    <section className="mx-auto flex w-full max-w-[210mm] flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <Input
            {...form.register('title')}
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
          </div>
        </div>
        {isEditMode && <Badge variant="secondary">Editing</Badge>}
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Textarea
        {...form.register('content')}
        placeholder="Start writing..."
        className="placeholder:text-muted-foreground resize-y border-0 bg-transparent px-0 py-0 font-serif text-xl! shadow-none focus-visible:ring-0"
      />
    </section>
  )
}

export default JournalEditor
