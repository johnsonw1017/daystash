import { NextResponse } from 'next/server'
import { createMobileUploadSession } from '@/lib/mobile-upload-server'
import { mobileUploadSessionRequestSchema } from '@/lib/mobile-upload'
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

  const payload = mobileUploadSessionRequestSchema.safeParse(await request.json())

  if (!payload.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const session = await createMobileUploadSession({
      editorSessionId: payload.data.editorSessionId,
      insertAfterBlockClientId: payload.data.insertAfterBlockClientId,
      userId: user.id,
    })

    return NextResponse.json({
      expiresAt: session.expires_at,
      token: session.token,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not create mobile upload session',
      },
      { status: 500 }
    )
  }
}
