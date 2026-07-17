import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '@/test/mocks/server'

process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.signature'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  localStorage.clear()
  document.cookie = 'sb-supabase-auth-token=; Max-Age=0; Path=/'
  server.resetHandlers()
})
afterAll(() => server.close())
