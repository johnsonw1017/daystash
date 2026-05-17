export const DEFAULT_POST_LOGIN_REDIRECT = '/dashboard'

export const PROTECTED_ROUTES = ['/dashboard', '/settings', '/write'] as const

export const isProtectedPath = (pathname: string): boolean => {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

export const getSafeRedirectPath = (
  redirectTo: string | null | undefined
): string => {
  if (!redirectTo) return DEFAULT_POST_LOGIN_REDIRECT
  if (!redirectTo.startsWith('/')) return DEFAULT_POST_LOGIN_REDIRECT
  if (redirectTo.startsWith('//')) return DEFAULT_POST_LOGIN_REDIRECT

  return redirectTo
}
