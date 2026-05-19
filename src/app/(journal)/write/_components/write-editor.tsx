'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { saveJournalDraft } from '@/app/(journal)/write/actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type WriteFormValues = {
  title: string
  content: string
}

const WriteEditor = () => {
  const [journalId, setJournalId] = useState<string | undefined>(undefined)
  const [errorMessage, setErrorMessage] = useState('')

  const form = useForm<WriteFormValues>({
    defaultValues: {
      title: '',
      content: '',
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (values: WriteFormValues) => {
      return saveJournalDraft({
        journalId,
        title: values.title,
        content: values.content,
      })
    },
    onSuccess: (response) => {
      setJournalId(response.journalId)
      toast.success('Journal saved')
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
      <div className="flex items-center gap-3">
        <Input
          {...form.register('title')}
          placeholder="Title"
          className="placeholder:text-muted-foreground h-auto border-0 bg-transparent px-0 py-0 font-serif text-3xl font-semibold shadow-none focus-visible:ring-0 md:text-4xl"
        />
        <Button
          type="button"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Textarea
        {...form.register('content')}
        placeholder="Start writing..."
        className="placeholder:text-muted-foreground resize-y border-0 bg-transparent px-0 py-0 font-serif text-xl! shadow-none focus-visible:ring-0"
      />
    </section>
  )
}

export default WriteEditor
