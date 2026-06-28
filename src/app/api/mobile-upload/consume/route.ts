import { NextResponse } from 'next/server'
import { getMobileUploadSessionByToken } from '@/lib/mobile-upload-server'
import {
  mobileUploadConsumeRequestSchema,
  type StagedMobileUploadImage,
} from '@/lib/mobile-upload'
import { createServerSideClient } from '@/lib/supabase/server'

type SessionImageRow = StagedMobileUploadImage & {
  consumed_at: string | null
  cloudinary_public_id: string
  position: number
}

export const POST = async (request: Request) => {
  const payload = mobileUploadConsumeRequestSchema.safeParse(await request.json())

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

    const consumedAt = new Date().toISOString()
    const { data: rows, error: rowsError } = await supabase
      .from('mobile_upload_session_images')
      .update({ consumed_at: consumedAt })
      .eq('session_id', session.id)
      .is('consumed_at', null)
      .select('id, cloudinary_public_id, width, height, position, created_at, consumed_at')
      .order('position', { ascending: true })

    if (rowsError) {
      throw new Error(rowsError.message)
    }

    const images = (rows ?? []) as SessionImageRow[]

    if (!images.length) {
      return NextResponse.json({ images: [] })
    }

    return NextResponse.json({
      images: images.map((image) => ({
        id: image.id,
        publicId: image.cloudinary_public_id,
        width: image.width,
        height: image.height,
        created_at: image.created_at,
      })),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not consume staged images',
      },
      { status: 500 }
    )
  }
}
