import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type LogoProps = {
  className?: string
  imageClassName?: string
  textClassName?: string
}

const Logo = ({ className, imageClassName, textClassName }: LogoProps) => {
  return (
    <Link
      href="/"
      aria-label="Go to home"
      className={cn('inline-flex min-w-0 items-center gap-3', className)}
    >
      <Image
        src="/daystash-leaf.svg"
        alt="logo"
        width={18}
        height={30}
        className={cn('h-7 w-auto shrink-0 object-contain', imageClassName)}
        aria-hidden="true"
      />
      <h2
        className={cn('truncate font-serif text-3xl font-bold', textClassName)}
      >
        Daystash
      </h2>
    </Link>
  )
}

export default Logo
