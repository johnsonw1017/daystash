import { NextResponse } from 'next/server'
import { getMobileUploadSessionByToken } from '@/lib/mobile-upload-server'
import { mobileUploadCompleteRequestSchema } from '@/lib/mobile-upload'
import { createAdminClient } from '@/lib/supabase/server'

export const POST = async (request: Request) => {
  const payload = mobileUploadCompleteRequestSchema.safeParse(await request.json())

  if (!payload.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const session = await getMobileUploadSessionByToken(payload.data.token, {
      useAdminClient: true,
    })

    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
    }

    const supabase = createAdminClient()
    const { data: lastImage, error: lastImageError } = await supabase
      .from('mobile_upload_session_images')
      .select('position')
      .eq('session_id', session.id)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastImageError) {
      throw new Error(lastImageError.message)
    }

    const { error: insertError } = await supabase
      .from('mobile_upload_session_images')
      .insert({
        session_id: session.id,
        cloudinary_public_id: payload.data.image.publicId,
        width: payload.data.image.width,
        height: payload.data.image.height,
        alt_text: payload.data.image.altText ?? null,
        position: ((lastImage as { position: number } | null)?.position ?? -1) + 1,
      })

    if (insertError) {
      throw new Error(insertError.message)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Could not stage upload',
      },
      { status: 500 }
    )
  }
}
