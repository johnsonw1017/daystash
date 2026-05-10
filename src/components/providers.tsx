'use client'

import { useState } from 'react'
import { Provider as JotaiProvider } from 'jotai'
import { useHydrateAtoms } from 'jotai/utils'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { queryClientAtom } from 'jotai-tanstack-query'

type ProvidersProps = {
  children: React.ReactNode
}

type HydrateQueryClientProps = {
  children: React.ReactNode
  queryClient: QueryClient
}

const HydrateQueryClient = ({
  children,
  queryClient,
}: HydrateQueryClientProps) => {
  useHydrateAtoms([[queryClientAtom, queryClient]])
  return children
}

const Providers = ({ children }: ProvidersProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            gcTime: Infinity,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <HydrateQueryClient queryClient={queryClient}>
          {children}
        </HydrateQueryClient>
      </JotaiProvider>
    </QueryClientProvider>
  )
}

export default Providers
