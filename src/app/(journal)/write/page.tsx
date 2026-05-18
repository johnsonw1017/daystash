import { requireAuth } from '@/lib/auth/require-auth'

const WritePage = async () => {
  await requireAuth('/write')

  return <div>write page</div>
}

export default WritePage
