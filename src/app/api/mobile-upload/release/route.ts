import { NextResponse } from 'next/server'
import { getMobileUploadSessionByToken } from '@/lib/mobile-upload-server'
import { mobileUploadReleaseRequestSchema } from '@/lib/mobile-upload'
import { createServerSideClient } from '@/lib/supabase/server'

export const POST = async (request: Request) => {
  const payload = mobileUploadReleaseRequestSchema.safeParse(await request.json())

  if (!payload.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const supabase = await createServerSideClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const session = await getMobileUploadSessionByToken(payload.data.token)

    if (!session || session.user_id !== user.id) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
    }

    const { error } = await supabase
      .from('mobile_upload_session_images')
      .update({ consumed_at: null })
      .eq('session_id', session.id)
      .in('id', payload.data.imageIds)

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ released: true })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not release staged images',
      },
      { status: 500 }
    )
  }
}
