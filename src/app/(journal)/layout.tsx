import { requireAuth } from '@/lib/auth/require-auth'
import JournalMobileShell from '@/components/navigation/journal-mobile-shell'

type JournalLayoutProps = {
  children: React.ReactNode
}

const JournalLayout = async ({ children }: JournalLayoutProps) => {
  await requireAuth('/dashboard')
  return <JournalMobileShell>{children}</JournalMobileShell>
}

export default JournalLayout
