'use client'

import { useAtomValue, useSetAtom } from 'jotai'
import { authStateAtom, refreshAuthStateAtom } from '@/lib/atoms/auth'

export const useAuth = () => useAtomValue(authStateAtom)

export const useRefreshAuth = () => useSetAtom(refreshAuthStateAtom)
