import { CircleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type JournalLoadErrorProps = {
  className?: string
  onRetry: () => void
  title: string
}

const JournalLoadError = ({
  className,
  onRetry,
  title,
}: JournalLoadErrorProps) => (
  <Alert variant="destructive" className={cn('max-w-xl', className)}>
    <CircleAlert />
    <AlertTitle className="line-clamp-none">{title}</AlertTitle>
    <AlertDescription>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </AlertDescription>
  </Alert>
)

export default JournalLoadError
