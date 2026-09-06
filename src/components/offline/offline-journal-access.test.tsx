import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import OfflineJournalAccess from '@/components/offline/offline-journal-access'

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}))

const setOnline = (online: boolean) => {
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    value: online,
  })
}

describe('OfflineJournalAccess', () => {
  afterEach(() => setOnline(true))

  it('offers a full-page navigation to the cached offline workspace', async () => {
    setOnline(false)
    render(<OfflineJournalAccess />)

    expect(
      await screen.findByRole('link', { name: /open offline journals/i })
    ).toHaveAttribute('href', '/offline')
  })
})
