'use client'

import { useState, type ReactElement } from 'react'
import { format, parseISO } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { useSetAtom } from 'jotai'
import { Calendar } from '@/components/ui/calendar'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { useAuthUser } from '@/hooks/use-auth-user'
import { useJournalMonth, useJournalTimelineMonths } from '@/hooks/use-journals'
import { dashboardCalendarDateAtom } from '@/lib/atoms/dashboard-navigation'
import { MobileToolbarAction } from '@/components/navigation/mobile-toolbar'
import { cn } from '@/lib/utils'

type JournalCalendarDrawerProps = {
  direction?: 'bottom' | 'right'
  trigger: ReactElement
}

export const JournalCalendarDrawer = ({
  direction = 'bottom',
  trigger,
}: JournalCalendarDrawerProps) => {
  const authUser = useAuthUser()
  const setCalendarDate = useSetAtom(dashboardCalendarDateAtom)
  const [open, setOpen] = useState(false)
  const { data: timelineMonths = [] } = useJournalTimelineMonths(
    authUser.user?.id
  )
  const [month, setMonth] = useState<Date | undefined>()
  const latestMonth = timelineMonths[0]?.month
  const displayedMonth =
    month ?? (latestMonth ? parseISO(latestMonth) : undefined)
  const { data: journals = [] } = useJournalMonth(
    authUser.user?.id,
    displayedMonth ? format(displayedMonth, 'yyyy-MM-dd') : ''
  )
  const journalDates = new Set(journals.map((journal) => journal.date))

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent
        onCloseAutoFocus={(event) => event.preventDefault()}
        className={cn(
          direction === 'right' && 'w-128 max-w-none sm:max-w-none'
        )}
      >
        <DrawerHeader>
          <DrawerTitle>Journal calendar</DrawerTitle>
          <DrawerDescription>
            Choose a day with a journal to view it in your stash.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {displayedMonth ? (
            <Calendar
              mode="single"
              month={displayedMonth}
              onMonthChange={setMonth}
              disabled={(date) => !journalDates.has(format(date, 'yyyy-MM-dd'))}
              modifiers={{
                hasJournal: (date) =>
                  journalDates.has(format(date, 'yyyy-MM-dd')),
              }}
              modifiersClassNames={{ hasJournal: 'font-semibold text-primary' }}
              onSelect={(date) => {
                if (!date) return
                setCalendarDate({
                  date: format(date, 'yyyy-MM-dd'),
                  requestId: Date.now(),
                })
                setOpen(false)
              }}
              className={cn(
                'mx-auto',
                direction === 'right' && 'w-full [--cell-size:--spacing(12)]'
              )}
            />
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

const MobileCalendarAction = () => (
  <JournalCalendarDrawer
    trigger={<MobileToolbarAction icon={CalendarDays} label="Calendar" />}
  />
)

export default MobileCalendarAction
