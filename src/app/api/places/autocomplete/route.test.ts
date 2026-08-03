import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { POST } from '@/app/api/places/autocomplete/route'
import { createServerSideClient } from '@/lib/supabase/server'
import { server } from '@/test/mocks/server'
import { asMockedValue, createTestUser } from '@/test/mocks/types'

vi.mock('@/lib/supabase/server', () => ({
  createServerSideClient: vi.fn(),
}))

const mockedCreateServerSideClient = vi.mocked(createServerSideClient)

const createRequest = (body: unknown) =>
  new Request('https://daystash.test/api/places/autocomplete', {
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

describe('POST /api/places/autocomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('GOOGLE_MAPS_API_KEY', 'test-google-key')
    mockAuthUser()
  })

  it('returns only the top five mapped Google predictions', async () => {
    server.use(
      http.post(
        'https://places.googleapis.com/v1/places:autocomplete',
        async ({ request }) => {
          expect(request.headers.get('X-Goog-Api-Key')).toBe('test-google-key')
          await expect(request.json()).resolves.toMatchObject({
            input: 'Kyoto',
            sessionToken: 'session-1',
          })

          return HttpResponse.json({
            suggestions: Array.from({ length: 6 }, (_, index) => ({
              placePrediction: {
                placeId: `place-${index + 1}`,
                structuredFormat: {
                  mainText: { text: `Place ${index + 1}` },
                  secondaryText: { text: 'Kyoto, Japan' },
                },
              },
            })),
          })
        }
      )
    )

    const response = await POST(
      createRequest({ input: 'Kyoto', sessionToken: 'session-1' })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      suggestions: Array.from({ length: 5 }, (_, index) => ({
        googlePlaceId: `place-${index + 1}`,
        name: `Place ${index + 1}`,
        description: 'Kyoto, Japan',
      })),
    })
  })

  it('softly biases Google suggestions around a valid nearby location', async () => {
    server.use(
      http.post(
        'https://places.googleapis.com/v1/places:autocomplete',
        async ({ request }) => {
          await expect(request.json()).resolves.toEqual({
            input: 'Cafe',
            locationBias: {
              circle: {
                center: { latitude: -27.47, longitude: 153.025 },
                radius: 50_000,
              },
            },
          })
          return HttpResponse.json({ suggestions: [] })
        }
      )
    )

    const response = await POST(
      createRequest({
        input: 'Cafe',
        locationBias: { latitude: -27.47, longitude: 153.025 },
      })
    )

    expect(response.status).toBe(200)
  })

  it('does not forward invalid nearby coordinates to Google', async () => {
    server.use(
      http.post(
        'https://places.googleapis.com/v1/places:autocomplete',
        async ({ request }) => {
          await expect(request.json()).resolves.toEqual({ input: 'Cafe' })
          return HttpResponse.json({ suggestions: [] })
        }
      )
    )

    const response = await POST(
      createRequest({
        input: 'Cafe',
        locationBias: { latitude: -127, longitude: 253 },
      })
    )

    expect(response.status).toBe(200)
  })

  it('does not call Google for searches shorter than two characters', async () => {
    const googleRequest = vi.fn()
    server.use(
      http.post(
        'https://places.googleapis.com/v1/places:autocomplete',
        googleRequest
      )
    )

    const response = await POST(createRequest({ input: 'K' }))

    await expect(response.json()).resolves.toEqual({ suggestions: [] })
    expect(googleRequest).not.toHaveBeenCalled()
  })

  it('rejects unauthenticated requests before calling Google', async () => {
    mockAuthUser(false)
    const googleRequest = vi.fn()
    server.use(
      http.post(
        'https://places.googleapis.com/v1/places:autocomplete',
        googleRequest
      )
    )

    const response = await POST(createRequest({ input: 'Kyoto' }))

    expect(response.status).toBe(401)
    expect(googleRequest).not.toHaveBeenCalled()
  })

  it('returns a gateway error when Google fails', async () => {
    server.use(
      http.post(
        'https://places.googleapis.com/v1/places:autocomplete',
        () => new HttpResponse(null, { status: 500 })
      )
    )

    const response = await POST(createRequest({ input: 'Kyoto' }))

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({
      error: 'Could not search places',
    })
  })
})
