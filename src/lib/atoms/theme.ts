'use client'

import { atomWithStorage } from 'jotai/utils'
import { isTheme, THEME_COOKIE_NAME, type Theme } from '@/lib/theme'

const getCookieTheme = () => {
  const themeCookie = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${THEME_COOKIE_NAME}=`))
    ?.split('=')[1]

  return isTheme(themeCookie) ? themeCookie : null
}

const setThemeCookie = (theme: Theme) => {
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=31536000; samesite=lax`
}

const themeStorage = {
  getItem: (key: string, initialValue: Theme) => {
    void key

    const storedTheme = window.localStorage.getItem(THEME_COOKIE_NAME)

    if (isTheme(storedTheme)) {
      return storedTheme
    }

    return getCookieTheme() ?? initialValue
  },
  setItem: (key: string, value: Theme) => {
    void key

    window.localStorage.setItem(THEME_COOKIE_NAME, value)
    setThemeCookie(value)
  },
  removeItem: (key: string) => {
    void key

    window.localStorage.removeItem(THEME_COOKIE_NAME)
    document.cookie = `${THEME_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`
  },
}

export const themeAtom = atomWithStorage<Theme>('theme', 'light', themeStorage, {
  getOnInit: true,
})
