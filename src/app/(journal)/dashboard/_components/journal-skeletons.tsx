import { Card, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export const JournalCardSkeleton = () => (
  <Card className="gap-0 overflow-hidden py-0">
    <Skeleton className="aspect-4/3 w-full rounded-none" />
    <CardHeader className="gap-3 p-4 sm:p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-5 w-2/5" />
    </CardHeader>
  </Card>
)

export const InitialJournalSkeletons = () => (
  <div className="space-y-4" aria-label="Loading journals" aria-live="polite">
    <Skeleton className="h-7 w-36" />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} style={{ animationDelay: `${index * 75}ms` }}>
          <JournalCardSkeleton />
        </div>
      ))}
    </div>
  </div>
)
