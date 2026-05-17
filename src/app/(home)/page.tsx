'use client'

import { Button } from '@/components/ui/button'
import Tree from './_components/Tree'
import Link from 'next/link'

const Home = () => {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Tree src="/tree.svg" />
        <h2 className="text-center font-serif text-5xl font-bold">
          Every day leaves something behind.
        </h2>
        <Button variant="accent" size="lg" asChild>
          <Link href="/write">Start Writing</Link>
        </Button>
      </div>
    </div>
  )
}

export default Home
