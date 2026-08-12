'use client'

import { useState } from 'react'
import { format, parseISO, subDays } from 'date-fns'
import Link from 'next/link'
import { CalendarIcon } from 'lucide-react'
import useJournalEditor from '@/components/journal-editor/hooks/use-journal-editor'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const JournalHeader = () => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const {
    errorMessage,
    headerActions,
    isEditMode,
    journalCreatedAt,
    journalDate,
    isSaving,
    save,
    setTitle,
    setJournalDate,
    title,
    viewHref,
  } = useJournalEditor()
  const createdAt = journalCreatedAt ? new Date(journalCreatedAt) : null
  const createdDate = createdAt
    ? new Date(
        createdAt.getUTCFullYear(),
        createdAt.getUTCMonth(),
        createdAt.getUTCDate()
      )
    : null
  const earliestDate = createdDate ? subDays(createdDate, 7) : null
  const selectedDate = journalDate ? parseISO(journalDate) : null
  const selectDate = (date: Date | undefined) => {
    if (!date) return

    setJournalDate(format(date, 'yyyy-MM-dd'))
    setIsDatePickerOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          className="placeholder:text-muted-foreground h-14 min-w-0 flex-1 overflow-hidden border-0 bg-transparent px-0 py-0 font-serif text-3xl leading-tight font-semibold shadow-none focus-visible:ring-0 md:h-16 md:text-4xl dark:bg-transparent"
        />
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            {isEditMode && viewHref && (
              <Button variant="outline" asChild>
                <Link href={viewHref}>View entry</Link>
              </Button>
            )}
            <Button type="button" onClick={save} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
          {headerActions}
        </div>
      </div>

      {isEditMode && selectedDate && createdDate && earliestDate && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Date</span>
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <CalendarIcon />
                {format(selectedDate, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              aria-label="Select journal date"
              aria-describedby={undefined}
            >
              <Calendar
                className="p-0"
                mode="single"
                selected={selectedDate}
                defaultMonth={selectedDate}
                disabled={{ before: earliestDate, after: createdDate }}
                onSelect={selectDate}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default JournalHeader
