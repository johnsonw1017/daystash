'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAtom } from 'jotai'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  ExternalLink,
  LoaderCircle,
  LocateFixed,
  MapPin,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { placeSearchBiasAtom } from '@/components/journal-editor/atoms'
import useJournalEditor from '@/components/journal-editor/hooks/use-journal-editor'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
  useComboboxAnchor,
} from '@/components/ui/combobox'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { GooglePlaceSuggestion } from '@/lib/google-places'
import type { JournalPlace } from '@/lib/journals'

type PlaceSearchErrorResponse = {
  error?: string
}

const getPlaceSearchErrorMessage = (
  status: number,
  error: PlaceSearchErrorResponse
) => {
  if (status === 401) return 'Your session has expired. Please sign in again.'

  return error.error || 'Could not search places. Please try again.'
}

const roundLocationForBias = (coordinate: number) =>
  Math.round(coordinate * 1000) / 1000

const waitForAutocompleteDelay = (signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const handleAbort = () => {
      window.clearTimeout(timeout)
      reject(new DOMException('Autocomplete cancelled', 'AbortError'))
    }
    const timeout = window.setTimeout(() => {
      signal.removeEventListener('abort', handleAbort)
      resolve()
    }, 300)

    signal.addEventListener('abort', handleAbort, { once: true })
  })

const PlaceSelector = () => {
  const { places, setPlaces } = useJournalEditor()
  const anchor = useComboboxAnchor()
  const [input, setInput] = useState('')
  const [sessionToken, setSessionToken] = useState(() => crypto.randomUUID())
  const [locationBias, setLocationBias] = useAtom(placeSearchBiasAtom)
  const [isLocating, setIsLocating] = useState(false)
  const cleanedInput = input.trim()

  const toggleNearbyLocation = () => {
    if (locationBias) {
      setLocationBias(null)
      return
    }

    if (!navigator.geolocation) {
      toast.error('Location is not available in this browser')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (
          !Number.isFinite(coords.latitude) ||
          !Number.isFinite(coords.longitude)
        ) {
          setIsLocating(false)
          toast.error('Could not determine your location')
          return
        }

        setLocationBias({
          latitude: roundLocationForBias(coords.latitude),
          longitude: roundLocationForBias(coords.longitude),
          updatedAt: new Date().toISOString(),
        })
        setIsLocating(false)
        toast.success('Nearby search enabled')
      },
      () => {
        setIsLocating(false)
        toast.error('Location permission was not granted')
      },
      {
        enableHighAccuracy: false,
        maximumAge: 10 * 60 * 1000,
        timeout: 5000,
      }
    )
  }

  const autocompleteQuery = useQuery({
    queryKey: [
      'places',
      'autocomplete',
      sessionToken,
      cleanedInput,
      locationBias?.latitude,
      locationBias?.longitude,
    ],
    queryFn: async ({ signal }) => {
      await waitForAutocompleteDelay(signal)
      const response = await fetch('/api/places/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: cleanedInput,
          sessionToken,
          locationBias: locationBias
            ? {
                latitude: locationBias.latitude,
                longitude: locationBias.longitude,
              }
            : undefined,
        }),
        signal,
      })
      if (!response.ok) {
        const error = (await response
          .json()
          .catch(() => ({}))) as PlaceSearchErrorResponse
        console.error('Place search failed', { status: response.status, error })
        throw new Error(getPlaceSearchErrorMessage(response.status, error))
      }

      const data = (await response.json()) as {
        suggestions?: GooglePlaceSuggestion[]
      }
      return (data.suggestions ?? []).slice(0, 5)
    },
    enabled: cleanedInput.length >= 2,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
  const suggestions = autocompleteQuery.data ?? []

  const placeDetailsMutation = useMutation({
    mutationFn: async (suggestion: GooglePlaceSuggestion) => {
      const response = await fetch('/api/places/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googlePlaceId: suggestion.googlePlaceId,
          sessionToken,
        }),
      })
      if (!response.ok) throw new Error('Could not load place')

      const data = (await response.json()) as { place?: JournalPlace }
      if (!data.place) throw new Error('Place details were incomplete')
      return data.place
    },
    onSuccess: (place) => {
      setPlaces((currentPlaces) =>
        currentPlaces.some((item) => item.googlePlaceId === place.googlePlaceId)
          ? currentPlaces
          : [...currentPlaces, place]
      )
      setInput('')
      setSessionToken(crypto.randomUUID())
    },
    onError: () => toast.error('Could not add place'),
  })

  const selectPlace = (suggestion: GooglePlaceSuggestion | null) => {
    if (
      !suggestion ||
      places.some((place) => place.googlePlaceId === suggestion.googlePlaceId)
    ) {
      return
    }

    placeDetailsMutation.mutate(suggestion)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label
          htmlFor="journal-places"
          className="text-muted-foreground gap-1.5"
        >
          <MapPin className="size-4" /> Places
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={locationBias ? 'default' : 'outline'}
                size="icon-sm"
                className="size-11 lg:size-8"
                onClick={toggleNearbyLocation}
                disabled={isLocating}
                aria-label={
                  locationBias
                    ? 'Disable nearby place suggestions'
                    : 'Use nearby place suggestions'
                }
                aria-pressed={Boolean(locationBias)}
              >
                {isLocating ? (
                  <LoaderCircle className="size-5 animate-spin lg:size-4" />
                ) : (
                  <LocateFixed className="size-5 lg:size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-64">
              {locationBias
                ? 'Nearby suggestions are active. Click to stop using your saved location.'
                : 'Use your browser location to improve Google place suggestions. It is saved only on this device.'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Combobox
        items={suggestions}
        inputValue={input}
        onInputValueChange={setInput}
        onValueChange={selectPlace}
        value={null}
        itemToStringLabel={(item: GooglePlaceSuggestion) => item.name}
        itemToStringValue={(item: GooglePlaceSuggestion) => item.googlePlaceId}
      >
        <ComboboxChips ref={anchor}>
          {places.map((place) => (
            <ComboboxChip key={place.googlePlaceId} showRemove={false}>
              <MapPin className="size-3" />
              {place.name}
              <Link
                href={place.googleMapsUri}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${place.name} in Google Maps`}
              >
                <ExternalLink className="size-3" />
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-foreground -mr-1 size-5"
                onClick={() =>
                  setPlaces(
                    places.filter(
                      (item) => item.googlePlaceId !== place.googlePlaceId
                    )
                  )
                }
                aria-label={`Remove ${place.name}`}
              >
                <X />
              </Button>
            </ComboboxChip>
          ))}
          <ComboboxChipsInput id="journal-places" placeholder="Add a place…" />
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxList>
            {suggestions.map((suggestion) => (
              <ComboboxItem key={suggestion.googlePlaceId} value={suggestion}>
                <MapPin className="size-4" />
                <span>
                  <span className="block">{suggestion.name}</span>
                  <span className="text-muted-foreground block text-xs">
                    {suggestion.description}
                  </span>
                </span>
              </ComboboxItem>
            ))}
            <ComboboxEmpty>
              {autocompleteQuery.isFetching
                ? 'Searching…'
                : autocompleteQuery.isError
                  ? autocompleteQuery.error.message
                  : 'No places found'}
            </ComboboxEmpty>
          </ComboboxList>
          {suggestions.length > 0 && (
            <>
              <ComboboxSeparator />
              <p className="text-muted-foreground px-3 py-2 text-right text-xs">
                Powered by Google
              </p>
            </>
          )}
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

export default PlaceSelector
