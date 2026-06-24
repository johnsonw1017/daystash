import { randomUUID } from 'crypto'
import {
  createAdminClient,
  createServerSideClient,
} from '@/lib/supabase/server'
import { MOBILE_UPLOAD_SESSION_TTL_MS } from '@/lib/mobile-upload'

type SessionRow = {
  editor_session_id: string
  expires_at: string
  id: string
  insert_after_block_client_id: string
  token: string
  user_id: string
}

export const createMobileUploadSession = async ({
  editorSessionId,
  insertAfterBlockClientId,
  userId,
}: {
  editorSessionId: string
  insertAfterBlockClientId: string
  userId: string
}) => {
  const supabase = await createServerSideClient()
  const token = randomUUID()
  const expiresAt = new Date(Date.now() + MOBILE_UPLOAD_SESSION_TTL_MS).toISOString()

  const { data, error } = await supabase
    .from('mobile_upload_sessions')
    .insert({
      user_id: userId,
      editor_session_id: editorSessionId,
      insert_after_block_client_id: insertAfterBlockClientId,
      token,
      expires_at: expiresAt,
    })
    .select('id, token, expires_at, user_id, editor_session_id, insert_after_block_client_id')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Could not create mobile upload session')
  }

  return data as SessionRow
}

export const getMobileUploadSessionByToken = async (
  token: string,
  options?: { useAdminClient?: boolean }
) => {
  const supabase = options?.useAdminClient
    ? createAdminClient()
    : await createServerSideClient()

  const { data, error } = await supabase
    .from('mobile_upload_sessions')
    .select('id, token, expires_at, user_id, editor_session_id, insert_after_block_client_id')
    .eq('token', token)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return null
  }

  const session = data as SessionRow

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    return null
  }

  return session
}
