'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'

const VerifyEmailPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Verify Your Email</h1>
      <p>
        Thank you for signing up! Please check your email to verify your
        account.
      </p>
      <Button asChild size="sm">
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  )
}

export default VerifyEmailPage
