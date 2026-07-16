import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
  <Card className="sticky top-4 z-10 gap-1 overflow-hidden p-2 lg:top-24">
    <nav
      aria-label="Journal years"
      className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible"
    >
      {isLoading
        ? Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-20 shrink-0 lg:w-full" />
          ))
        : years.map((year) => (
            <Button
              key={year}
              type="button"
              variant={year === activeYear ? 'default' : 'ghost'}
              className="min-w-20 shrink-0 justify-center text-base lg:w-full lg:justify-start"
              aria-current={year === activeYear ? 'true' : undefined}
              onClick={() => onSelectYear(year)}
            >
              {year}
            </Button>
          ))}
    </nav>
  </Card>
)

export default YearTimeline
