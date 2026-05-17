'use client'

import { Button } from '@/components/ui/button'
import Tree from './_components/Tree'
import Link from 'next/link'

const Home = () => {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center overflow-hidden">
      <div className="mt-16 flex flex-col items-center px-4">
        <Tree src="/tree.svg" />
      </div>
      <div className="bg-secondary/35 -mt-4 flex h-full min-h-0 w-full flex-1 flex-col items-center gap-4 px-4 pt-10 md:rounded-t-[40%]">
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
