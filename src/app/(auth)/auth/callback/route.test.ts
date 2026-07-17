import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/(auth)/auth/callback/route'
import { createServerSideClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createServerSideClient: vi.fn(),
}))

const mockedCreateServerSideClient = vi.mocked(createServerSideClient)

const mockExchangeCodeForSession = (error: { message: string } | null) => {
  const exchangeCodeForSession = vi.fn().mockResolvedValue({ error })

  mockedCreateServerSideClient.mockResolvedValue({
    auth: {
      exchangeCodeForSession,
    },
  })

  return exchangeCodeForSession
}

describe('GET /auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exchanges auth codes and redirects to a safe next path', async () => {
    const exchangeCodeForSession = mockExchangeCodeForSession(null)

    const response = await GET(
      new NextRequest('https://daystash.test/auth/callback?code=abc&next=/dashboard')
    )

    expect(exchangeCodeForSession).toHaveBeenCalledWith('abc')
    expect(response.headers.get('location')).toBe('https://daystash.test/dashboard')
  })

  it('falls back to home for unsafe next paths', async () => {
    mockExchangeCodeForSession(null)

    const response = await GET(
      new NextRequest(
        'https://daystash.test/auth/callback?code=abc&next=https://example.com'
      )
    )

    expect(response.headers.get('location')).toBe('https://daystash.test/')
  })

  it('redirects to login when the code is missing or exchange fails', async () => {
    const missingCodeResponse = await GET(
      new NextRequest('https://daystash.test/auth/callback')
    )

    expect(missingCodeResponse.headers.get('location')).toBe(
      'https://daystash.test/login?error=auth_failed'
    )

    mockExchangeCodeForSession({ message: 'bad code' })

    const failedExchangeResponse = await GET(
      new NextRequest('https://daystash.test/auth/callback?code=bad-code')
    )

    expect(failedExchangeResponse.headers.get('location')).toBe(
      'https://daystash.test/login?error=auth_failed'
    )
  })
})
