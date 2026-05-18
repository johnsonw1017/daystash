import { requireAuth } from '@/lib/auth/require-auth'

const DashboardPage = async () => {
  await requireAuth('/dashboard')

  return <div>dashboard</div>
}

export default DashboardPage
