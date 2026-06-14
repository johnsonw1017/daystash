'use client'

import UserMenu from '@/components/header/user-menu'
import ThemeToggle from '@/components/header/theme-toggle'

const HeaderControls = () => {
  return (
    <div className="flex items-center gap-3">
      <ThemeToggle />
      <UserMenu />
    </div>
  )
}

export default HeaderControls
