import { requireAuth } from '@/lib/auth/require-auth'
import JournalEditor from '@/app/(journal)/write/_components/journal-editor'

const WritePage = async () => {
  await requireAuth('/write')

  return (
    <div className="px-4 pb-10">
      <JournalEditor />
    </div>
  )
}

export default WritePage
