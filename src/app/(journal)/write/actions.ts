'use server'

import { requireAuth } from '@/lib/auth/require-auth'
import {
  getJournalThumbnailAssetId,
  getReferencedAssetIds,
  normalizeJournalBlocks,
  normalizeJournalPlaces,
  parseJournalBlocks,
  type SaveJournalInput,
  type RegisterJournalAssetsInput,
} from '@/lib/journals'
import { createAdminClient } from '@/lib/supabase/server'

type OwnedJournalRow = {
  id: string
  blocks: unknown
}

type JournalAssetRow = {
  id: string
  cloudinary_public_id: string
  width: number
  height: number
}

const ensureOwnedJournal = async ({
  journalId,
  userId,
}: {
  journalId: string
  userId: string
}) => {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('journals')
    .select('id')
    .eq('id', journalId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Journal not found')
  }

  return data
}

const getOwnedJournalBlocks = async ({
  journalId,
  userId,
}: {
  journalId: string
  userId: string
}) => {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('journals')
    .select('id, blocks')
    .eq('id', journalId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Journal not found')
  }

  return data as OwnedJournalRow
}

const ensureJournal = async ({
  journalId,
  title,
  userId,
}: {
  journalId?: string
  title: string
  userId: string
}) => {
  const supabase = createAdminClient()
  const cleanedTitle = title.trim() || 'Untitled Journal'

  if (!journalId) {
    const { data, error } = await supabase
      .from('journals')
      .insert({
        user_id: userId,
        title: cleanedTitle,
      })
      .select('id')
      .single()

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create journal')
    }

    return {
      journalId: data.id,
      title: cleanedTitle,
    }
  }

  await ensureOwnedJournal({ journalId, userId })

  return {
    journalId,
    title: cleanedTitle,
  }
}

const getJournalAssets = async (journalId: string) => {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('journal_assets')
    .select('id, cloudinary_public_id, width, height')
    .eq('journal_id', journalId)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as JournalAssetRow[]
}

const deleteJournalAssets = async ({
  assetIds,
  journalId,
}: {
  assetIds: string[]
  journalId: string
}) => {
  if (!assetIds.length) {
    return
  }

  const supabase = createAdminClient()
  const { error: deleteError } = await supabase
    .from('journal_assets')
    .delete()
    .eq('journal_id', journalId)
    .in('id', assetIds)

  if (deleteError) {
    throw new Error(deleteError.message)
  }
}

const deleteJournalRecord = async ({
  journalId,
  userId,
}: {
  journalId: string
  userId: string
}) => {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('journals')
    .delete()
    .eq('id', journalId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(error.message)
  }
}

export const registerJournalAssets = async ({
  journalId,
  title,
  assets,
}: RegisterJournalAssetsInput) => {
  const user = await requireAuth('/write')
  const nextJournal = await ensureJournal({
    journalId,
    title,
    userId: user.id,
  })

  if (!assets.length) {
    return {
      journalId: nextJournal.journalId,
      assets: [],
    }
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('journal_assets')
    .insert(
      assets.map((asset) => ({
        id: crypto.randomUUID(),
        journal_id: nextJournal.journalId,
        user_id: user.id,
        cloudinary_public_id: asset.publicId,
        width: asset.width,
        height: asset.height,
      }))
    )
    .select('id, cloudinary_public_id, width, height')

  if (error) {
    throw new Error(error.message)
  }

  return {
    journalId: nextJournal.journalId,
    assets: (data ?? []).map((asset) => ({
      assetId: asset.id,
      publicId: asset.cloudinary_public_id,
      width: asset.width,
      height: asset.height,
      altText: null,
    })),
  }
}

const prepareJournalSave = async ({
  journalId,
  title,
  date,
  blocks,
  places = [],
  thumbnailAssetId: requestedThumbnailAssetId = null,
}: SaveJournalInput) => {
  const user = await requireAuth('/write')
  const nextJournal = await ensureJournal({
    journalId,
    title,
    userId: user.id,
  })

  const normalizedBlocks = normalizeJournalBlocks(blocks)
  const normalizedPlaces = normalizeJournalPlaces(places)
  const referencedAssetIds = getReferencedAssetIds(normalizedBlocks)
  const existingAssets = await getJournalAssets(nextJournal.journalId)
  const requestedThumbnailAssetIdIsValid =
    requestedThumbnailAssetId &&
    referencedAssetIds.has(requestedThumbnailAssetId) &&
    existingAssets.some((asset) => asset.id === requestedThumbnailAssetId)
  const thumbnailAssetId = getJournalThumbnailAssetId(
    normalizedBlocks,
    requestedThumbnailAssetIdIsValid ? requestedThumbnailAssetId : null
  )
  const orphanedAssetIds = existingAssets
    .filter((asset) => !referencedAssetIds.has(asset.id))
    .map((asset) => asset.id)

  return {
    journalId: nextJournal.journalId,
    userId: user.id,
    title: nextJournal.title,
    date: date ?? null,
    blocks: normalizedBlocks,
    places: normalizedPlaces,
    thumbnailAssetId,
    orphanedAssetIds,
    updatedAt: new Date().toISOString(),
  }
}

const mapPlacesForSave = (places: ReturnType<typeof normalizeJournalPlaces>) =>
  places.map((place) => ({
    name: place.name,
    formatted_address: place.formattedAddress,
    google_place_id: place.googlePlaceId,
    google_maps_uri: place.googleMapsUri,
    latitude: place.latitude,
    longitude: place.longitude,
  }))

export const saveJournal = async (input: SaveJournalInput) => {
  const prepared = await prepareJournalSave(input)

  const supabase = createAdminClient()
  const { error } = await supabase.rpc('save_journal_with_places', {
    p_journal_id: prepared.journalId,
    p_user_id: prepared.userId,
    p_title: prepared.title,
    p_blocks: prepared.blocks,
    p_thumbnail_asset_id: prepared.thumbnailAssetId,
    p_date: prepared.date,
    p_updated_at: prepared.updatedAt,
    p_places: mapPlacesForSave(prepared.places),
  })

  if (error) throw new Error(error.message)

  await deleteJournalAssets({
    assetIds: prepared.orphanedAssetIds,
    journalId: prepared.journalId,
  })

  return {
    journalId: prepared.journalId,
    blocks: prepared.blocks,
    places: prepared.places,
    thumbnailAssetId: prepared.thumbnailAssetId,
  }
}

export const saveJournalAndRegenerateSlug = async (input: SaveJournalInput) => {
  if (!input.journalId) {
    throw new Error('A saved journal is required to regenerate its slug')
  }

  const prepared = await prepareJournalSave(input)
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc(
    'save_journal_with_places_and_regenerate_slug',
    {
      p_journal_id: prepared.journalId,
      p_user_id: prepared.userId,
      p_title: prepared.title,
      p_blocks: prepared.blocks,
      p_thumbnail_asset_id: prepared.thumbnailAssetId,
      p_date: prepared.date,
      p_updated_at: prepared.updatedAt,
      p_places: mapPlacesForSave(prepared.places),
      p_orphaned_asset_ids: prepared.orphanedAssetIds,
    }
  )

  if (error) throw new Error(error.message)
  if (typeof data !== 'string') {
    throw new Error('Supabase did not return the regenerated journal slug')
  }

  return {
    journalId: prepared.journalId,
    blocks: prepared.blocks,
    places: prepared.places,
    thumbnailAssetId: prepared.thumbnailAssetId,
    slug: data,
  }
}

export const discardJournalSessionChanges = async ({
  journalId,
  sessionAssetIds,
}: {
  journalId: string
  sessionAssetIds: string[]
}) => {
  const user = await requireAuth('/write')
  const journal = await getOwnedJournalBlocks({ journalId, userId: user.id })
  const savedBlocks = parseJournalBlocks(journal.blocks)
  const savedAssetIds = getReferencedAssetIds(savedBlocks)
  const staleSessionAssetIds = [...new Set(sessionAssetIds)].filter(
    (assetId) => !savedAssetIds.has(assetId)
  )

  if (!savedBlocks.length) {
    const allAssetIds = (await getJournalAssets(journalId)).map(
      (asset) => asset.id
    )

    await deleteJournalAssets({
      assetIds: allAssetIds,
      journalId,
    })
    await deleteJournalRecord({ journalId, userId: user.id })

    return { discarded: true, deletedJournal: true }
  }

  await deleteJournalAssets({
    assetIds: staleSessionAssetIds,
    journalId,
  })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('journals')
    .update({
      draft_blocks: null,
      has_unsaved_draft: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', journalId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  return { discarded: true, deletedJournal: false }
}

export const deleteJournal = async ({ journalId }: { journalId: string }) => {
  const user = await requireAuth('/dashboard')
  await ensureOwnedJournal({ journalId, userId: user.id })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('journals')
    .delete()
    .eq('id', journalId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  return { deleted: true }
}
