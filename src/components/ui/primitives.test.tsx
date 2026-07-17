import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'
import { Textarea } from '@/components/ui/textarea'

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark' }),
}))

vi.mock('sonner', () => ({
  Toaster: ({ className, icons, theme }: { className?: string; icons: object; theme: string }) => (
    <div className={className} data-icon-count={Object.keys(icons).length} data-theme={theme} />
  ),
}))

describe('UI primitives', () => {
  it('renders text inputs with slots and forwarded props', () => {
    render(<Input aria-label="Title" className="custom-input" type="text" />)

    const input = screen.getByRole('textbox', { name: /title/i })

    expect(input).toHaveAttribute('data-slot', 'input')
    expect(input).toHaveClass('custom-input')
  })

  it('renders textareas with slots and forwarded props', () => {
    render(<Textarea aria-label="Body" className="custom-textarea" />)

    const textarea = screen.getByRole('textbox', { name: /body/i })

    expect(textarea).toHaveAttribute('data-slot', 'textarea')
    expect(textarea).toHaveClass('custom-textarea')
  })

  it('renders alert content with accessible role', () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Upload failed</AlertTitle>
        <AlertDescription>Try again later.</AlertDescription>
      </Alert>
    )

    expect(screen.getByRole('alert')).toHaveAttribute('data-slot', 'alert')
    expect(screen.getByText('Upload failed')).toHaveAttribute('data-slot', 'alert-title')
    expect(screen.getByText('Try again later.')).toHaveAttribute(
      'data-slot',
      'alert-description'
    )
  })

  it('renders badges with variant data attributes', () => {
    render(<Badge variant="secondary">Saved</Badge>)

    expect(screen.getByText('Saved')).toHaveAttribute('data-variant', 'secondary')
  })

  it('renders all card composition slots', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Trip</CardTitle>
          <CardDescription>Daily notes</CardDescription>
          <CardAction>Edit</CardAction>
        </CardHeader>
        <CardContent>Photos</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    )

    expect(screen.getByText('Trip')).toHaveAttribute('data-slot', 'card-title')
    expect(screen.getByText('Daily notes')).toHaveAttribute(
      'data-slot',
      'card-description'
    )
    expect(screen.getByText('Edit')).toHaveAttribute('data-slot', 'card-action')
    expect(screen.getByText('Photos')).toHaveAttribute('data-slot', 'card-content')
    expect(screen.getByText('Footer')).toHaveAttribute('data-slot', 'card-footer')
  })

  it('renders labels, separators, and skeletons', () => {
    render(
      <>
        <Label htmlFor="title">Title</Label>
        <Separator orientation="vertical" aria-label="Divider" />
        <Skeleton aria-label="Loading" />
      </>
    )

    expect(screen.getByText('Title')).toHaveAttribute('data-slot', 'label')
    expect(screen.getByLabelText('Divider')).toHaveAttribute('data-slot', 'separator')
    expect(screen.getByLabelText('Loading')).toHaveAttribute('data-slot', 'skeleton')
  })

  it('passes theme and icons to the toaster', () => {
    const { container } = render(<Toaster />)
    const toaster = container.firstElementChild

    expect(toaster).toHaveClass('toaster')
    expect(toaster).toHaveAttribute('data-theme', 'dark')
    expect(toaster).toHaveAttribute('data-icon-count', '5')
  })
})
