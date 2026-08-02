export type GooglePlaceSuggestion = {
  googlePlaceId: string
  name: string
  description: string
}

export const GOOGLE_PLACE_SUGGESTION_LIMIT = 5

export const getGoogleMapsApiKey = () => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY is not configured')
  return apiKey
}
