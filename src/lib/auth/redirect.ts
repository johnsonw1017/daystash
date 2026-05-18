export const DEFAULT_POST_LOGIN_REDIRECT = '/'

export const PROTECTED_ROUTES = ['/dashboard', '/write'] as const
export const AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/verify-email',
  '/update-password',
] as const

export const isProtectedPath = (pathname: string): boolean => {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

export const isAuthPath = (pathname: string): boolean => {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}?`)
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

export const getPostLoginRedirectPath = (
  redirectTo: string | null | undefined
): string => {
  const safeRedirectTo = getSafeRedirectPath(redirectTo)
  return isAuthPath(safeRedirectTo)
    ? DEFAULT_POST_LOGIN_REDIRECT
    : safeRedirectTo
}
