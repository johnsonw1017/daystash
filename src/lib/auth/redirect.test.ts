import { describe, expect, it } from 'vitest'
import {
  DEFAULT_POST_LOGIN_REDIRECT,
  getPostLoginRedirectPath,
  getSafeRedirectPath,
  isAuthPath,
  isProtectedPath,
} from '@/lib/auth/redirect'

describe('auth redirect helpers', () => {
  it('matches protected app paths and nested protected paths', () => {
    expect(isProtectedPath('/dashboard')).toBe(true)
    expect(isProtectedPath('/dashboard/2026')).toBe(true)
    expect(isProtectedPath('/write')).toBe(true)
    expect(isProtectedPath('/write/draft')).toBe(true)
    expect(isProtectedPath('/login')).toBe(false)
  })

  it('matches auth paths and auth paths with query strings', () => {
    expect(isAuthPath('/login')).toBe(true)
    expect(isAuthPath('/login?redirectTo=/dashboard')).toBe(true)
    expect(isAuthPath('/register')).toBe(true)
    expect(isAuthPath('/dashboard')).toBe(false)
  })

  it('rejects missing, absolute, and protocol-relative redirects', () => {
    expect(getSafeRedirectPath(null)).toBe(DEFAULT_POST_LOGIN_REDIRECT)
    expect(getSafeRedirectPath('https://example.com')).toBe(DEFAULT_POST_LOGIN_REDIRECT)
    expect(getSafeRedirectPath('//example.com')).toBe(DEFAULT_POST_LOGIN_REDIRECT)
  })

  it('keeps safe local redirects', () => {
    expect(getSafeRedirectPath('/dashboard?year=2026')).toBe('/dashboard?year=2026')
  })

  it('does not redirect users back to auth pages after login', () => {
    expect(getPostLoginRedirectPath('/login')).toBe(DEFAULT_POST_LOGIN_REDIRECT)
    expect(getPostLoginRedirectPath('/update-password')).toBe(DEFAULT_POST_LOGIN_REDIRECT)
    expect(getPostLoginRedirectPath('/dashboard')).toBe('/dashboard')
  })
})
