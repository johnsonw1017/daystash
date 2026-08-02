import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import PlaceSelector from '@/components/journal-editor/place-selector'
import useJournalEditor from '@/components/journal-editor/hooks/use-journal-editor'
import type { JournalPlace } from '@/lib/journals'
import { server } from '@/test/mocks/server'
import { asMockedValue } from '@/test/mocks/types'

vi.mock('@/components/journal-editor/hooks/use-journal-editor', () => ({
  default: vi.fn(),
}))

const mockedUseJournalEditor = vi.mocked(useJournalEditor)
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

  render(
    <QueryClientProvider client={queryClient}>
      <PlaceSelector />
    </QueryClientProvider>
  )

  return { setPlaces }
}

describe('PlaceSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
})
