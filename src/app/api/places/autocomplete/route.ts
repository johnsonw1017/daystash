import { NextResponse } from 'next/server'
import {
  GOOGLE_PLACE_BIAS_RADIUS_METERS,
  getGoogleMapsApiKey,
  GOOGLE_PLACE_SUGGESTION_LIMIT,
  type GooglePlaceSuggestion,
} from '@/lib/google-places'
import { createServerSideClient } from '@/lib/supabase/server'

type GoogleAutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string
      structuredFormat?: {
        mainText?: { text?: string }
        secondaryText?: { text?: string }
      }
      text?: { text?: string }
    }
  }>
}

export const POST = async (request: Request) => {
  const supabase = await createServerSideClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as {
    input?: unknown
    sessionToken?: unknown
    locationBias?: {
      latitude?: unknown
      longitude?: unknown
    }
  } | null
  const input =
    typeof body?.input === 'string' ? body.input.trim().slice(0, 200) : ''
  const sessionToken =
    typeof body?.sessionToken === 'string'
      ? body.sessionToken.slice(0, 100)
      : ''
  const latitude = body?.locationBias?.latitude
  const longitude = body?.locationBias?.longitude
  const hasValidLocationBias =
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180

  if (input.length < 2) return NextResponse.json({ suggestions: [] })

  let response: Response
  try {
    response = await fetch(
      'https://places.googleapis.com/v1/places:autocomplete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': getGoogleMapsApiKey(),
          'X-Goog-FieldMask':
            'suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text',
        },
        body: JSON.stringify({
          input,
          sessionToken: sessionToken || undefined,
          locationBias: hasValidLocationBias
            ? {
                circle: {
                  center: { latitude, longitude },
                  radius: GOOGLE_PLACE_BIAS_RADIUS_METERS,
                },
              }
            : undefined,
        }),
        cache: 'no-store',
      }
    )
  } catch (error) {
    console.error('Google Places autocomplete request failed', error)
    return NextResponse.json(
      { error: 'Place search is temporarily unavailable' },
      { status: 502 }
    )
  }

  if (!response.ok) {
    console.error('Google Places autocomplete returned an error', {
      status: response.status,
      statusText: response.statusText,
    })
    return NextResponse.json(
      { error: 'Place search is temporarily unavailable' },
      { status: 502 }
    )
  }

  const data = (await response.json()) as GoogleAutocompleteResponse
  const suggestions: GooglePlaceSuggestion[] = (data.suggestions ?? [])
    .flatMap(({ placePrediction }) => {
      const googlePlaceId = placePrediction?.placeId
      const name = placePrediction?.structuredFormat?.mainText?.text
      if (!googlePlaceId || !name) return []
      return [
        {
          googlePlaceId,
          name,
          description:
            placePrediction.structuredFormat?.secondaryText?.text ??
            placePrediction.text?.text ??
            '',
        },
      ]
    })
    .slice(0, GOOGLE_PLACE_SUGGESTION_LIMIT)

  return NextResponse.json({ suggestions })
}
