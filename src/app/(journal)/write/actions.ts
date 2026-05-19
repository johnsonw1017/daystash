'use server'

import { requireAuth } from '@/lib/auth/require-auth'
import { createServerSideClient } from '@/lib/supabase/server'

type SaveJournalInput = {
  journalId?: string
  title: string
  content: string
}

const extractParagraphs = (content: string) => {
  return content
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
}

export const saveJournalDraft = async ({
  journalId,
  title,
  content,
}: SaveJournalInput) => {
  const user = await requireAuth('/write')
  const supabase = await createServerSideClient()

  const cleanedTitle = title.trim() || 'Untitled Journal'
  const paragraphs = extractParagraphs(content)
  let nextJournalId = journalId

  if (!nextJournalId) {
    const { data, error } = await supabase
      .from('journals')
      .insert({
        user_id: user.id,
        title: cleanedTitle,
      })
      .select('id')
      .single()

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create journal')
    }

    nextJournalId = data.id
  } else {
    const { error } = await supabase
      .from('journals')
      .update({
        title: cleanedTitle,
        updated_at: new Date().toISOString(),
      })
      .eq('id', nextJournalId)
      .eq('user_id', user.id)

    if (error) {
      throw new Error(error.message)
    }
  }

  const { error: deleteError } = await supabase
    .from('journal_blocks')
    .delete()
    .eq('journal_id', nextJournalId)
    .eq('type', 'text')

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (paragraphs.length > 0) {
    const blocks = paragraphs.map((paragraph, index) => ({
      journal_id: nextJournalId,
      type: 'text',
      position: index,
      text_content: paragraph,
    }))

    const { error: insertError } = await supabase
      .from('journal_blocks')
      .insert(blocks)

    if (insertError) {
      throw new Error(insertError.message)
    }
  }

  return { journalId: nextJournalId }
}
