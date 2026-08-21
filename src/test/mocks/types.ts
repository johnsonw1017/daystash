import type { User } from '@supabase/supabase-js'
import type { AuthProfile } from '@/lib/atoms/auth'

export const createTestUser = (id = 'user-id'): User => ({
  id,
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00.000Z',
})

export const createTestProfile = (id = 'user-id'): AuthProfile => ({
  id,
  full_name: 'Jamie Doe',
  email: 'jamie@example.com',
  avatar_url: null,
})

/** Narrows intentionally partial test doubles to the dependency contract. */
export const asMockedValue = <Value>(value: unknown): Value => value as Value
