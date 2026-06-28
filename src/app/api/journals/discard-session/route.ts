import { NextResponse } from 'next/server'
import { discardJournalSessionChanges } from '@/app/(journal)/write/actions'
import { createServerSideClient } from '@/lib/supabase/server'

export const POST = async (request: Request) => {
  const supabase = await createServerSideClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { journalId, sessionAssetIds } = body as {
    journalId?: unknown
    sessionAssetIds?: unknown
  }

  if (typeof journalId !== 'string' || journalId.length === 0) {
    return NextResponse.json({ error: 'Invalid journal id' }, { status: 400 })
  }

  const normalizedSessionAssetIds = Array.isArray(sessionAssetIds)
    ? sessionAssetIds.filter((assetId): assetId is string => typeof assetId === 'string')
    : []

  try {
    await discardJournalSessionChanges({
      journalId,
      sessionAssetIds: normalizedSessionAssetIds,
    })

    return NextResponse.json({ discarded: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Journal not found') {
      return NextResponse.json({ discarded: true })
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not discard journal session',
      },
      { status: 500 }
    )
  }
}
