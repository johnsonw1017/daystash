import { Provider, createStore } from 'jotai'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { placeSearchBiasAtom } from '@/components/journal-editor/atoms'
import PlaceSelector from '@/components/journal-editor/place-selector'
import useJournalEditor from '@/components/journal-editor/hooks/use-journal-editor'
import type { JournalPlace } from '@/lib/journals'
import { server } from '@/test/mocks/server'
import { asMockedValue } from '@/test/mocks/types'

vi.mock('@/components/journal-editor/hooks/use-journal-editor', () => ({
  default: vi.fn(),
}))

const mockedUseJournalEditor = vi.mocked(useJournalEditor)
const originalGeolocation = Object.getOwnPropertyDescriptor(
  navigator,
  'geolocation'
)
const place: JournalPlace = {
  googlePlaceId: 'place-1',
  name: 'Fushimi Inari Taisha',
  formattedAddress: 'Kyoto, Japan',
  googleMapsUri: 'https://maps.google.com/place/1',
  latitude: 34.9671,
  longitude: 135.7727,
}

const renderSelector = (places: JournalPlace[] = []) => {
  const setPlaces = vi.fn()
  mockedUseJournalEditor.mockReturnValue(
    asMockedValue<ReturnType<typeof useJournalEditor>>({ places, setPlaces })
  )
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const store = createStore()
  store.set(placeSearchBiasAtom, null)

  render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <PlaceSelector />
      </QueryClientProvider>
    </Provider>
  )

  return { setPlaces, store }
}

describe('PlaceSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    if (originalGeolocation) {
      Object.defineProperty(navigator, 'geolocation', originalGeolocation)
    } else {
      Reflect.deleteProperty(navigator, 'geolocation')
    }
  })

  it('renders saved Place links and removes them from draft state', async () => {
    const { setPlaces } = renderSelector([place])

    expect(screen.getByLabelText('Places')).toBeInTheDocument()
    expect(
      screen.getByRole('link', {
        name: 'Open Fushimi Inari Taisha in Google Maps',
      })
    ).toHaveAttribute('href', place.googleMapsUri)

    await userEvent.click(
      screen.getByRole('button', { name: 'Remove Fushimi Inari Taisha' })
    )

    expect(setPlaces).toHaveBeenCalledWith([])
  })

  it('searches after typing and adds selected Google Place details', async () => {
    server.use(
      http.post('/api/places/autocomplete', () =>
        HttpResponse.json({
          suggestions: [
            {
              googlePlaceId: 'place-1',
              name: 'Fushimi Inari Taisha',
              description: 'Kyoto, Japan',
            },
          ],
        })
      ),
      http.post('/api/places/details', () => HttpResponse.json({ place }))
    )
    const { setPlaces } = renderSelector()
    const input = screen.getByLabelText('Places')

    await userEvent.type(input, 'Fushimi')
    await userEvent.click(await screen.findByText('Fushimi Inari Taisha'))

    await waitFor(() => expect(setPlaces).toHaveBeenCalledOnce())
    const updatePlaces = setPlaces.mock.calls[0]?.[0]
    expect(typeof updatePlaces).toBe('function')
    expect(updatePlaces([])).toEqual([place])
  })

  it('explains nearby search and uses a consented location as the bias', async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) =>
      success({
        coords: { latitude: -27.4698, longitude: 153.0251 },
      } as GeolocationPosition)
    )
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    })
    let autocompleteBody: Record<string, unknown> | undefined
    server.use(
      http.post('/api/places/autocomplete', async ({ request }) => {
        autocompleteBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ suggestions: [] })
      })
    )
    renderSelector()
    const useNearbyButton = screen.getByRole('button', { name: 'Use Nearby' })

    await userEvent.hover(useNearbyButton)
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      /saved only on this device/i
    )

    await userEvent.click(useNearbyButton)

    expect(getCurrentPosition).toHaveBeenCalledOnce()
    expect(getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      {
        enableHighAccuracy: false,
        maximumAge: 10 * 60 * 1000,
        timeout: 5000,
      }
    )
    await waitFor(() =>
      expect(useNearbyButton).toHaveAttribute('aria-pressed', 'true')
    )
    expect(localStorage.getItem('daystash:place-search-bias')).toContain(
      '"latitude":-27.47'
    )

    await userEvent.type(screen.getByLabelText('Places'), 'Cafe')
    await waitFor(() =>
      expect(autocompleteBody).toMatchObject({
        locationBias: { latitude: -27.47, longitude: 153.025 },
      })
    )
  })

  it('lets the user remove a saved nearby bias', async () => {
    const { store } = renderSelector()
    act(() => {
      store.set(placeSearchBiasAtom, {
        latitude: -27.47,
        longitude: 153.025,
        updatedAt: '2026-08-03T00:00:00.000Z',
      })
    })

    const stopNearbyButton = await screen.findByRole('button', {
      name: 'Stop using nearby location',
    })
    await userEvent.click(stopNearbyButton)

    expect(store.get(placeSearchBiasAtom)).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Stop using nearby location' })
    ).not.toBeInTheDocument()
  })
})
