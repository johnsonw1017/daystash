import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { POST } from '@/app/api/places/details/route'
import { createServerSideClient } from '@/lib/supabase/server'
import { server } from '@/test/mocks/server'
import { asMockedValue, createTestUser } from '@/test/mocks/types'

vi.mock('@/lib/supabase/server', () => ({
  createServerSideClient: vi.fn(),
}))

const mockedCreateServerSideClient = vi.mocked(createServerSideClient)

const createRequest = (body: unknown) =>
  new Request('https://daystash.test/api/places/details', {
    method: 'POST',
    body: JSON.stringify(body),
  })

const mockAuthUser = (authenticated = true) => {
  mockedCreateServerSideClient.mockResolvedValue(
    asMockedValue<Awaited<ReturnType<typeof createServerSideClient>>>({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: authenticated ? createTestUser() : null },
          error: null,
        }),
      },
    })
  )
}

describe('POST /api/places/details', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('GOOGLE_MAPS_API_KEY', 'test-google-key')
    mockAuthUser()
  })

  it('maps complete Google Place details to the journal contract', async () => {
    server.use(
      http.get(
        'https://places.googleapis.com/v1/places/place-1',
        ({ request }) => {
          const url = new URL(request.url)
          expect(url.searchParams.get('sessionToken')).toBe('session-1')
          expect(request.headers.get('X-Goog-Api-Key')).toBe('test-google-key')

          return HttpResponse.json({
            id: 'place-1',
            displayName: { text: 'Fushimi Inari Taisha' },
            formattedAddress: 'Kyoto, Japan',
            googleMapsUri: 'https://maps.google.com/place/1',
            location: { latitude: 34.9671, longitude: 135.7727 },
          })
        }
      )
    )

    const response = await POST(
      createRequest({ googlePlaceId: 'place-1', sessionToken: 'session-1' })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      place: {
        googlePlaceId: 'place-1',
        name: 'Fushimi Inari Taisha',
        formattedAddress: 'Kyoto, Japan',
        googleMapsUri: 'https://maps.google.com/place/1',
        latitude: 34.9671,
        longitude: 135.7727,
      },
    })
  })

  it('rejects missing place IDs without calling Google', async () => {
    const googleRequest = vi.fn()
    server.use(
      http.get('https://places.googleapis.com/v1/places/*', googleRequest)
    )

    const response = await POST(createRequest({}))

    expect(response.status).toBe(400)
    expect(googleRequest).not.toHaveBeenCalled()
  })

  it('rejects incomplete Google Place responses', async () => {
    server.use(
      http.get('https://places.googleapis.com/v1/places/place-1', () =>
        HttpResponse.json({ id: 'place-1', displayName: { text: 'Kyoto' } })
      )
    )

    const response = await POST(createRequest({ googlePlaceId: 'place-1' }))

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({
      error: 'Google returned incomplete place details',
    })
  })

  it('rejects unauthenticated requests', async () => {
    mockAuthUser(false)

    const response = await POST(createRequest({ googlePlaceId: 'place-1' }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
  })
})
