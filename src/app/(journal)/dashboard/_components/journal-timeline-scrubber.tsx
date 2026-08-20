'use client'

import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { differenceInCalendarMonths, format, parseISO } from 'date-fns'
import { ChevronsUpDown } from 'lucide-react'
import type { JournalTimelineMonth } from '@/hooks/use-journals'
import { cn } from '@/lib/utils'

type JournalTimelineScrubberProps = {
  activeIndex: number
  months: JournalTimelineMonth[]
  onSelectIndex: (index: number, behavior?: ScrollBehavior) => void
}

const JournalTimelineScrubber = ({
  activeIndex,
  months,
  onSelectIndex,
}: JournalTimelineScrubberProps) => {
  const scrubberRef = useRef<HTMLDivElement>(null)
  const selectionFrameRef = useRef<number | null>(null)
  const pendingIndexRef = useRef<number | null>(null)
  const lastSelectedIndexRef = useRef<number | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [scrubY, setScrubY] = useState(0)
  const [scrubIndex, setScrubIndex] = useState<number | null>(null)
  const displayedIndex =
    isScrubbing && scrubIndex !== null ? scrubIndex : activeIndex
  const activeMonth = months[displayedIndex]
  const timelineLabels = useMemo(() => {
    const newest = parseISO(months[0]?.month ?? '')
    const oldest = parseISO(months.at(-1)?.month ?? '')
    const spanInMonths = Math.abs(differenceInCalendarMonths(newest, oldest))

    if (spanInMonths <= 18) {
      const crossesYear = newest.getFullYear() !== oldest.getFullYear()
      return months.map((month, index) => ({
        index,
        label: format(parseISO(month.month), crossesYear ? 'MMM yyyy' : 'MMMM'),
        value: month.month,
      }))
    }

    return [
      ...new Set(months.map((month) => parseISO(month.month).getFullYear())),
    ].map((year) => ({
      index: months.findIndex(
        (month) => parseISO(month.month).getFullYear() === year
      ),
      label: String(year),
      value: String(year),
    }))
  }, [months])

  useEffect(
    () => () => {
      if (selectionFrameRef.current !== null) {
        cancelAnimationFrame(selectionFrameRef.current)
      }
    },
    []
  )

  if (!activeMonth || !months.length) return null

  const updateScrubY = (clientY: number) => {
    const scrubber = scrubberRef.current
    if (!scrubber) return
    const rect = scrubber.getBoundingClientRect()
    setScrubY(Math.max(44, Math.min(rect.height - 44, clientY - rect.top)))
  }

  const selectFromPointer = (clientY: number) => {
    const scrubber = scrubberRef.current
    if (!scrubber) return
    const rect = scrubber.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
    const index = Math.round(ratio * (months.length - 1))
    updateScrubY(clientY)
    setScrubIndex(index)

    if (index === lastSelectedIndexRef.current) return

    pendingIndexRef.current = index
    if (selectionFrameRef.current !== null) return

    selectionFrameRef.current = requestAnimationFrame(() => {
      selectionFrameRef.current = null
      const pendingIndex = pendingIndexRef.current
      if (
        pendingIndex === null ||
        pendingIndex === lastSelectedIndexRef.current
      ) {
        return
      }

      lastSelectedIndexRef.current = pendingIndex
      onSelectIndex(pendingIndex, 'auto')
    })
  }

  const beginScrub = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    lastSelectedIndexRef.current = null
    setIsScrubbing(true)
    selectFromPointer(event.clientY)
  }

  const endScrub = () => {
    setIsScrubbing(false)
    setScrubIndex(null)
    lastSelectedIndexRef.current = null
  }

  const activeDate = parseISO(activeMonth.month)
  const label = format(activeDate, 'MMMM yyyy')

  return (
    <div
      ref={scrubberRef}
      className="fixed inset-y-0 right-0 z-20 w-12 touch-none lg:w-10"
      onPointerEnter={(event) => {
        setIsHovered(true)
        updateScrubY(event.clientY)
      }}
      onPointerLeave={() => setIsHovered(false)}
      onPointerDown={beginScrub}
      onPointerMove={(event) => {
        if (isScrubbing) {
          selectFromPointer(event.clientY)
        } else {
          updateScrubY(event.clientY)
        }
      }}
      onPointerUp={endScrub}
      onPointerCancel={endScrub}
    >
      <div
        role="slider"
        aria-label="Journal timeline"
        aria-valuemin={0}
        aria-valuemax={months.length - 1}
        aria-valuenow={displayedIndex}
        aria-valuetext={label}
        tabIndex={0}
        className="absolute inset-y-0 right-0 w-full outline-none"
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            onSelectIndex(Math.max(0, activeIndex - 1))
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            onSelectIndex(Math.min(months.length - 1, activeIndex + 1))
          }
        }}
      >
        {isHovered || isScrubbing ? (
          <span
            aria-hidden="true"
            className={cn(
              'bg-background absolute right-1 z-10 -translate-y-1/2 place-items-center rounded-full border shadow-md',
              isScrubbing ? 'grid size-9' : 'hidden size-9 lg:grid'
            )}
            style={{ top: scrubY }}
          >
            <ChevronsUpDown className="text-muted-foreground size-4" />
          </span>
        ) : null}

        {isScrubbing ? (
          <output
            className="bg-background absolute right-14 -translate-y-1/2 rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap shadow-lg lg:right-12"
            style={{ top: scrubY }}
          >
            {label}
          </output>
        ) : null}

        {isScrubbing
          ? timelineLabels.map(({ index, label: timelineLabel, value }) => {
              const top =
                months.length === 1 ? 50 : (index / (months.length - 1)) * 100
              const isActive =
                value === activeMonth.month ||
                value === String(activeDate.getFullYear())

              return (
                <span
                  key={value}
                  aria-hidden="true"
                  className={cn(
                    'bg-background/90 absolute right-2 -translate-y-1/2 rounded-full px-2 py-0.5 text-xs font-semibold shadow-sm transition-all',
                    isActive && 'bg-primary text-primary-foreground scale-110'
                  )}
                  style={{ top: `${top}%` }}
                >
                  {timelineLabel}
                </span>
              )
            })
          : null}
      </div>
    </div>
  )
}

export default JournalTimelineScrubber
