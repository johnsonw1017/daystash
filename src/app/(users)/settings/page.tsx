import { requireAuth } from '@/lib/auth/require-auth'

const SettingsPage = async () => {
  await requireAuth('/settings')

  return <div>settings</div>
}

export default SettingsPage
