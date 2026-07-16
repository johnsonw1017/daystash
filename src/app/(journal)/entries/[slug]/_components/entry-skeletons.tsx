import { Skeleton } from '@/components/ui/skeleton'

export const EntryViewSkeleton = () => (
  <section
    className="mx-auto flex w-full max-w-[800px] flex-col gap-6"
    aria-label="Loading entry"
    aria-live="polite"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="w-full max-w-md space-y-3">
        <Skeleton className="h-10 w-4/5 md:h-12" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-9 w-16 shrink-0" />
    </div>

    <article className="space-y-4">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-11/12" />
      <Skeleton className="h-6 w-4/5" />
      <Skeleton className="aspect-4/3 w-full" />
      <Skeleton className="h-6 w-10/12" />
      <Skeleton className="h-6 w-3/5" />
    </article>
  </section>
)

export const EntryEditSkeleton = () => (
  <section
    className="mx-auto flex w-full max-w-[800px] flex-col gap-8"
    aria-label="Loading editor"
    aria-live="polite"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="w-full max-w-lg space-y-3">
        <Skeleton className="h-14 w-4/5 md:h-16" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="flex shrink-0 gap-2">
        <Skeleton className="size-9" />
        <Skeleton className="h-9 w-16" />
      </div>
    </div>

    <div className="space-y-5">
      <Skeleton className="h-7 w-full" />
      <Skeleton className="h-7 w-11/12" />
      <Skeleton className="h-7 w-3/4" />
      <Skeleton className="aspect-4/3 w-full" />
      <Skeleton className="h-7 w-10/12" />
    </div>
  </section>
)
