'use client'

import { useState } from 'react'
import { Provider as JotaiProvider } from 'jotai'
import { useHydrateAtoms } from 'jotai/utils'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { queryClientAtom } from 'jotai-tanstack-query'
import { ThemeProvider } from 'next-themes'
import AuthStateSync from '@/components/auth/auth-state-sync'

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
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <JotaiProvider>
          <HydrateQueryClient queryClient={queryClient}>
            <AuthStateSync />
            {children}
          </HydrateQueryClient>
        </JotaiProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default Providers
