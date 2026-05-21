import { requireAuth } from '@/lib/auth/require-auth'

type JournalLayoutProps = {
  children: React.ReactNode
}

const JournalLayout = async ({ children }: JournalLayoutProps) => {
  await requireAuth('/dashboard')
  return children
}

export default JournalLayout
