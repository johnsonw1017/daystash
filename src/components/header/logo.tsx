import Image from 'next/image'
import Link from 'next/link'

const Logo = () => {
  return (
    <div className="absolute top-3 left-3 z-50">
      <Link
        href="/"
        aria-label="Go to home"
        className="inline-flex items-center gap-3"
      >
        <Image
          src="/daystash-leaf.svg"
          alt="logo"
          width={24}
          height={24}
          aria-hidden="true"
        />
        <h2 className="font-serif text-3xl font-bold">Daystash</h2>
      </Link>
    </div>
  )
}

export default Logo
