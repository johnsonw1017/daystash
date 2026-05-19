import { requireAuth } from '@/lib/auth/require-auth'
import WriteEditor from '@/app/(journal)/write/_components/write-editor'

const WritePage = async () => {
  await requireAuth('/write')

  return (
    <div className="px-4 pb-10">
      <WriteEditor />
    </div>
  )
}

export default WritePage
