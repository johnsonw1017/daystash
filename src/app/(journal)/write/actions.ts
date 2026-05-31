'use server'

import { requireAuth } from '@/lib/auth/require-auth'
import cloudinary from '@/lib/cloudinary-server'
import type { JournalBlock, SaveJournalInput } from '@/lib/journals'
import { createServerSideClient } from '@/lib/supabase/server'

const normalizeBlocks = (blocks: JournalBlock[]): JournalBlock[] => {
  const normalized = blocks
    .map((block, index) => {
      if (block.type === 'text') {
        return {
          ...block,
          position: index,
          text_content: block.text_content,
        }
      }

      return {
        ...block,
        position: index,
        caption: block.caption?.trim() || null,
        images: block.images.map((image, imageIndex) => ({
          ...image,
          position: imageIndex,
          alt_text: image.alt_text?.trim() || null,
        })),
      }
    })
    .filter((block) => (block.type === 'text' ? block.text_content.trim().length > 0 : block.images.length > 0))

  if (!normalized.length) {
    return [{ type: 'text', position: 0, text_content: '' }]
  }

  return normalized.map((block, index) => ({ ...block, position: index }))
}

export const saveJournalDraft = async ({ journalId, title, blocks }: SaveJournalInput) => {
  const user = await requireAuth('/write')
  const supabase = await createServerSideClient()

  const cleanedTitle = title.trim() || 'Untitled Journal'
  const normalizedBlocks = normalizeBlocks(blocks)
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

  const { data: existingBlocks, error: existingBlocksError } = await supabase
    .from('journal_blocks')
    .select('id')
    .eq('journal_id', nextJournalId)

  if (existingBlocksError) {
    throw new Error(existingBlocksError.message)
  }

  const existingBlockIds = (existingBlocks ?? []).map((block) => block.id)

  if (existingBlockIds.length) {
    const { error: deleteImagesError } = await supabase
      .from('journal_block_images')
      .delete()
      .in('block_id', existingBlockIds)

    if (deleteImagesError) {
      throw new Error(deleteImagesError.message)
    }
  }

  const { error: deleteBlocksError } = await supabase
    .from('journal_blocks')
    .delete()
    .eq('journal_id', nextJournalId)

  if (deleteBlocksError) {
    throw new Error(deleteBlocksError.message)
  }

  const blockRows = normalizedBlocks.map((block) => ({
    type: block.type,
    journal_id: nextJournalId,
    position: block.position,
    text_content: block.type === 'text' ? block.text_content : '',
    caption: block.type === 'image' ? block.caption : null,
  }))

  const { data: insertedBlocks, error: insertBlocksError } = await supabase
    .from('journal_blocks')
    .insert(blockRows)
    .select('id, position, type')

  if (insertBlocksError) {
    throw new Error(insertBlocksError.message)
  }

  const imageRows = (insertedBlocks ?? []).flatMap((insertedBlock) => {
    const matchingBlock = normalizedBlocks.find(
      (block) => block.position === insertedBlock.position && block.type === 'image'
    )

    if (!matchingBlock || matchingBlock.type !== 'image') {
      return []
    }

    return matchingBlock.images.map((image, imagePosition) => ({
      block_id: insertedBlock.id,
      cloudinary_public_id: image.cloudinary_public_id,
      position: imagePosition,
      alt_text: image.alt_text,
      width: image.width,
      height: image.height,
    }))
  })

  if (imageRows.length > 0) {
    const { error: insertImagesError } = await supabase
      .from('journal_block_images')
      .insert(imageRows)

    if (insertImagesError) {
      throw new Error(insertImagesError.message)
    }
  }

  return { journalId: nextJournalId }
}

export const deleteJournalImage = async ({ imageId }: { imageId: string }) => {
  const user = await requireAuth('/write')
  const supabase = await createServerSideClient()

  const { data: imageRow, error: imageError } = await supabase
    .from('journal_block_images')
    .select('id, block_id, cloudinary_public_id')
    .eq('id', imageId)
    .single()

  if (imageError || !imageRow) {
    throw new Error(imageError?.message || 'Image not found')
  }

  const { data: blockOwner, error: ownerError } = await supabase
    .from('journal_blocks')
    .select('journals!inner(user_id)')
    .eq('id', imageRow.block_id)
    .single()

  if (ownerError) {
    throw new Error(ownerError.message)
  }

  const ownerUserId = (blockOwner as { journals: { user_id: string } }).journals.user_id

  if (ownerUserId !== user.id) {
    throw new Error('Unauthorized')
  }

  const destroyResult = await cloudinary.uploader.destroy(imageRow.cloudinary_public_id)

  if (!['ok', 'not found'].includes(destroyResult.result || '')) {
    throw new Error('Failed to delete image from Cloudinary')
  }

  const { error: deleteRowError } = await supabase
    .from('journal_block_images')
    .delete()
    .eq('id', imageRow.id)

  if (deleteRowError) {
    throw new Error(deleteRowError.message)
  }

  const { data: remainingImages, error: remainingError } = await supabase
    .from('journal_block_images')
    .select('id')
    .eq('block_id', imageRow.block_id)
    .order('position', { ascending: true })

  if (remainingError) {
    throw new Error(remainingError.message)
  }

  if (!remainingImages?.length) {
    const { error: deleteBlockError } = await supabase
      .from('journal_blocks')
      .delete()
      .eq('id', imageRow.block_id)

    if (deleteBlockError) {
      throw new Error(deleteBlockError.message)
    }

    return { deletedBlock: true }
  }

  for (const [position, image] of remainingImages.entries()) {
    const { error: updatePositionError } = await supabase
      .from('journal_block_images')
      .update({ position })
      .eq('id', image.id)

    if (updatePositionError) {
      throw new Error(updatePositionError.message)
    }
  }

  return { deletedBlock: false }
}

export const deleteJournal = async ({ journalId }: { journalId: string }) => {
  const user = await requireAuth('/dashboard')
  const supabase = await createServerSideClient()

  const { data: journal, error: journalError } = await supabase
    .from('journals')
    .select('id')
    .eq('id', journalId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (journalError) {
    throw new Error(journalError.message)
  }

  if (!journal) {
    throw new Error('Journal not found')
  }

  const { data: blocks, error: blocksError } = await supabase
    .from('journal_blocks')
    .select('id')
    .eq('journal_id', journalId)

  if (blocksError) {
    throw new Error(blocksError.message)
  }

  const blockIds = (blocks ?? []).map((block) => block.id)

  if (blockIds.length > 0) {
    const { data: images, error: imagesError } = await supabase
      .from('journal_block_images')
      .select('cloudinary_public_id')
      .in('block_id', blockIds)

    if (imagesError) {
      throw new Error(imagesError.message)
    }

    for (const image of images ?? []) {
      const destroyResult = await cloudinary.uploader.destroy(image.cloudinary_public_id)
      if (!['ok', 'not found'].includes(destroyResult.result || '')) {
        throw new Error('Failed to delete image from Cloudinary')
      }
    }

    const { error: deleteImagesError } = await supabase
      .from('journal_block_images')
      .delete()
      .in('block_id', blockIds)

    if (deleteImagesError) {
      throw new Error(deleteImagesError.message)
    }
  }

  const { error: deleteBlocksError } = await supabase
    .from('journal_blocks')
    .delete()
    .eq('journal_id', journalId)

  if (deleteBlocksError) {
    throw new Error(deleteBlocksError.message)
  }

  const { error: deleteJournalError } = await supabase
    .from('journals')
    .delete()
    .eq('id', journalId)
    .eq('user_id', user.id)

  if (deleteJournalError) {
    throw new Error(deleteJournalError.message)
  }

  return { deleted: true }
}
