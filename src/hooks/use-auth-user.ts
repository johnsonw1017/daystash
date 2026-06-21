'use client'

import { useAtomValue, useSetAtom } from 'jotai'
import { authUserAtom, setAuthUserAtom } from '@/lib/atoms/auth'

export const useAuthUser = () => useAtomValue(authUserAtom)

export const useRefreshAuthUser = () => useSetAtom(setAuthUserAtom)
