import { NextResponse } from 'next/server'
import { getGoogleMapsApiKey } from '@/lib/google-places'
import { createServerSideClient } from '@/lib/supabase/server'

type GooglePlaceDetails = {
  id?: string
  displayName?: { text?: string }
  formattedAddress?: string
  googleMapsUri?: string
  location?: { latitude?: number; longitude?: number }
}

export const POST = async (request: Request) => {
  const supabase = await createServerSideClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as {
    googlePlaceId?: unknown
    sessionToken?: unknown
  } | null
  const googlePlaceId =
    typeof body?.googlePlaceId === 'string' ? body.googlePlaceId.trim() : ''
  const sessionToken =
    typeof body?.sessionToken === 'string'
      ? body.sessionToken.slice(0, 100)
      : ''
  if (!googlePlaceId)
    return NextResponse.json({ error: 'Place ID is required' }, { status: 400 })

  const url = new URL(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(googlePlaceId)}`
  )
  if (sessionToken) url.searchParams.set('sessionToken', sessionToken)

  const response = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': getGoogleMapsApiKey(),
      'X-Goog-FieldMask':
        'id,displayName,formattedAddress,googleMapsUri,location',
    },
    cache: 'no-store',
  })
  if (!response.ok)
    return NextResponse.json({ error: 'Could not load place' }, { status: 502 })

  const place = (await response.json()) as GooglePlaceDetails
  if (
    !place.id ||
    !place.displayName?.text ||
    !place.googleMapsUri ||
    typeof place.location?.latitude !== 'number' ||
    typeof place.location.longitude !== 'number'
  ) {
    return NextResponse.json(
      { error: 'Google returned incomplete place details' },
      { status: 502 }
    )
  }

  return NextResponse.json({
    place: {
      googlePlaceId: place.id,
      name: place.displayName.text,
      formattedAddress: place.formattedAddress ?? null,
      googleMapsUri: place.googleMapsUri,
      latitude: place.location.latitude,
      longitude: place.location.longitude,
    },
  })
}
