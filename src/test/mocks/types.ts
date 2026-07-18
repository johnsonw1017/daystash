import type { User } from '@supabase/supabase-js'

export const createTestUser = (id = 'user-id'): User => ({
  id,
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00.000Z',
})

/** Narrows intentionally partial test doubles to the dependency contract. */
export const asMockedValue = <Value>(value: unknown): Value => value as Value
