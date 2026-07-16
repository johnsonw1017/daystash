import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

type YearTimelineProps = {
  activeYear: number | null
  isLoading: boolean
  onSelectYear: (year: number) => void
  years: number[]
}

const YearTimeline = ({
  activeYear,
  isLoading,
  onSelectYear,
  years,
}: YearTimelineProps) => (
  <div className="bg-background/95 sticky top-4 z-10 order-first py-1 backdrop-blur lg:top-24 lg:order-last lg:bg-transparent lg:py-0 lg:backdrop-blur-none">
    <nav
      aria-label="Journal years"
      className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible"
    >
      {isLoading
        ? Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-16 shrink-0 lg:w-full" />
          ))
        : years.map((year) => (
            <Button
              key={year}
              type="button"
              variant={year === activeYear ? 'default' : 'ghost'}
              size="sm"
              className="h-8 min-w-16 shrink-0 px-2 text-sm lg:w-full"
              aria-current={year === activeYear ? 'true' : undefined}
              onClick={() => onSelectYear(year)}
            >
              {year}
            </Button>
          ))}
    </nav>
  </div>
)

export default YearTimeline
