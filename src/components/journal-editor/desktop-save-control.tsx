'use client'

import { useEffect } from 'react'
import { Save } from 'lucide-react'
import useJournalEditor from '@/components/journal-editor/hooks/use-journal-editor'
import { Button } from '@/components/ui/button'

const DesktopSaveControl = () => {
  const { isDirty, isEditMode, isSaving, save } = useJournalEditor()
  const canSave = isEditMode && isDirty && !isSaving

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        !canSave ||
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== 's'
      ) {
        return
      }

      event.preventDefault()
      save()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canSave, save])

  if (!isEditMode || !isDirty) return null

  return (
    <Button
      type="button"
      className="fixed right-6 bottom-6 z-40 hidden shadow-lg lg:inline-flex"
      disabled={isSaving}
      onClick={save}
      title="Save changes (Command-S or Control-S)"
    >
      <Save />
      {isSaving ? 'Saving…' : 'Save changes'}
    </Button>
  )
}

export default DesktopSaveControl
