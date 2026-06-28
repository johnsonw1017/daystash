import MobileUploadClient from '@/app/(journal)/mobile-upload/[token]/_components/mobile-upload-client'
import { getMobileUploadSessionByToken } from '@/lib/mobile-upload-server'

export const dynamic = 'force-dynamic'

type MobileUploadPageProps = {
  params: Promise<{
    token: string
  }>
}

const MobileUploadPage = async ({ params }: MobileUploadPageProps) => {
  const { token } = await params
  const session = await getMobileUploadSessionByToken(token)

  if (!session) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10 text-center">
        <h1 className="text-2xl font-semibold">Upload link expired</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Return to your desktop editor and generate a new phone upload QR code.
        </p>
      </div>
    )
  }

  return <MobileUploadClient token={token} userId={session.user_id} />
}

export default MobileUploadPage
