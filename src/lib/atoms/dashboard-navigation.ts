'use client'

import { atom } from 'jotai'

export type DashboardCalendarSelection = {
  date: string
  requestId: number
}

export const dashboardCalendarDateAtom =
  atom<DashboardCalendarSelection | null>(null)
