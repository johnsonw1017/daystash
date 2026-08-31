'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'

const DesktopSearchAction = () => {
  const router = useRouter()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasExpandedRef = useRef(false)
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (expanded) {
      hasExpandedRef.current = true
      inputRef.current?.focus()
    } else if (hasExpandedRef.current) {
      triggerRef.current?.focus()
    }
  }, [expanded])

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedQuery = query.trim()

    if (normalizedQuery.length < 2) {
      inputRef.current?.focus()
      return
    }

    router.push(`/search?q=${encodeURIComponent(normalizedQuery)}`)
  }

  if (!expanded) {
    return (
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        className="shadow-lg"
        aria-expanded="false"
        onClick={() => setExpanded(true)}
      >
        <Search />
        Search
      </Button>
    )
  }

  return (
    <form role="search" onSubmit={submitSearch}>
      <InputGroup className="bg-background h-9 w-72 shadow-lg">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          type="search"
          aria-label="Search journals"
          placeholder="Search journals…"
          value={query}
          minLength={2}
          maxLength={200}
          required
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              setExpanded(false)
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            size="icon-xs"
            aria-label="Close search"
            onClick={() => setExpanded(false)}
          >
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  )
}

export default DesktopSearchAction
