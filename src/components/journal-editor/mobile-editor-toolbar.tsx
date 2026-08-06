'use client'

import { Eye, GripVertical, Plus, Save } from 'lucide-react'
import AddBlockDrawer from '@/components/journal-editor/add-block-drawer'
import useJournalEditor from '@/components/journal-editor/hooks/use-journal-editor'
import {
  MobileToolbar,
  MobileToolbarAction,
} from '@/components/navigation/mobile-toolbar'

type MobileEditorToolbarProps = {
  activeBlockId: string
  isAddBlockOpen: boolean
  isReordering: boolean
  onAddBlockOpenChange: (open: boolean) => void
  onReorderingChange: (active: boolean) => void
}

const MobileEditorToolbar = ({
  activeBlockId,
  isAddBlockOpen,
  isReordering,
  onAddBlockOpenChange,
  onReorderingChange,
}: MobileEditorToolbarProps) => {
  const { isEditMode, isSaving, save, viewHref } = useJournalEditor()

  return (
    <>
      <MobileToolbar label="Journal editor actions">
        <MobileToolbarAction
          disabled={!activeBlockId}
          icon={Plus}
          label="Add"
          onClick={() => onAddBlockOpenChange(true)}
        />
        <MobileToolbarAction
          active={isReordering}
          icon={GripVertical}
          label="Reorder"
          onClick={() => onReorderingChange(!isReordering)}
        />
        {isEditMode && viewHref ? (
          <MobileToolbarAction href={viewHref} icon={Eye} label="View" />
        ) : null}
        <MobileToolbarAction
          disabled={isSaving}
          icon={Save}
          label={isSaving ? 'Saving…' : 'Save'}
          onClick={save}
          variant="default"
        />
      </MobileToolbar>
      {activeBlockId ? (
        <AddBlockDrawer
          blockId={activeBlockId}
          open={isAddBlockOpen}
          onOpenChange={onAddBlockOpenChange}
        />
      ) : null}
    </>
  )
}

export default MobileEditorToolbar
