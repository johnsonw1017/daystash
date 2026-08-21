'use client'

import { useRef, useState, type ReactElement } from 'react'
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
import { useAuth } from '@/hooks/use-auth'
import { useJournalMonth, useJournalTimelineMonths } from '@/hooks/use-journals'
import { dashboardCalendarDateAtom } from '@/lib/atoms/dashboard-navigation'
import { MobileToolbarAction } from '@/components/navigation/mobile-toolbar'
import JournalLoadError from '@/components/journal-load-error'
import { cn } from '@/lib/utils'

type JournalCalendarDrawerProps = {
  direction?: 'bottom' | 'right'
  trigger: ReactElement
}

export const JournalCalendarDrawer = ({
  direction = 'bottom',
  trigger,
}: JournalCalendarDrawerProps) => {
  const auth = useAuth()
  const setCalendarDate = useSetAtom(dashboardCalendarDateAtom)
  const [open, setOpen] = useState(false)
  const navigationCloseRef = useRef(false)
  const {
    data: timelineMonths = [],
    error: timelineError,
    isLoading: isTimelineLoading,
    refetch: refetchTimeline,
  } = useJournalTimelineMonths(auth.userId ?? undefined)
  const [month, setMonth] = useState<Date | undefined>()
  const latestMonth = timelineMonths[0]?.month
  const oldestMonth = timelineMonths.at(-1)?.month
  const displayedMonth =
    month ?? (latestMonth ? parseISO(latestMonth) : undefined)
  const calendarStartMonth = oldestMonth ? parseISO(oldestMonth) : undefined
  const calendarEndMonth = latestMonth ? parseISO(latestMonth) : undefined
  const hasMultipleYears =
    calendarStartMonth?.getFullYear() !== calendarEndMonth?.getFullYear()
  const {
    data: journals = [],
    error: journalError,
    isLoading: isMonthLoading,
    refetch: refetchJournals,
  } = useJournalMonth(
    auth.userId ?? undefined,
    displayedMonth ? format(displayedMonth, 'yyyy-MM-dd') : ''
  )
  const journalDates = new Set(journals.map((journal) => journal.date))

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent
        onCloseAutoFocus={(event) => {
          if (!navigationCloseRef.current) return

          event.preventDefault()
          navigationCloseRef.current = false
        }}
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
          {timelineError ? (
            <JournalLoadError
              title="Journal calendar could not be loaded"
              onRetry={() => void refetchTimeline()}
            />
          ) : journalError ? (
            <JournalLoadError
              title="Journals for this month could not be loaded"
              onRetry={() => void refetchJournals()}
            />
          ) : isTimelineLoading || isMonthLoading || !displayedMonth ? (
            <p
              role="status"
              className="text-muted-foreground py-8 text-center text-sm"
            >
              Loading calendar…
            </p>
          ) : (
            <Calendar
              mode="single"
              month={displayedMonth}
              onMonthChange={setMonth}
              captionLayout={hasMultipleYears ? 'dropdown-years' : 'label'}
              startMonth={calendarStartMonth}
              endMonth={calendarEndMonth}
              disabled={(date) => !journalDates.has(format(date, 'yyyy-MM-dd'))}
              modifiers={{
                hasJournal: (date) =>
                  journalDates.has(format(date, 'yyyy-MM-dd')),
              }}
              modifiersClassNames={{ hasJournal: 'font-semibold text-primary' }}
              onSelect={(date) => {
                if (!date) return
                navigationCloseRef.current = true
                setCalendarDate({
                  date: format(date, 'yyyy-MM-dd'),
                  requestId: Date.now(),
                })
                setOpen(false)
              }}
              className={cn(
                'mx-auto w-full',
                direction === 'right'
                  ? '[--cell-size:--spacing(12)]'
                  : 'max-w-md'
              )}
            />
          )}
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
