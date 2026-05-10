'use client'

import { useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { forgotPassword } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>

const ForgotPasswordPage = () => {
  const [isPending, startTransition] = useTransition()

  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = (data: ForgotPasswordSchema) => {
    startTransition(async () => {
      const result = await forgotPassword(data)
      if (result?.error) {
        form.setError('root', { message: result.error })
      }
    })
  }

  // Show success state after submission
  if (form.formState.isSubmitSuccessful && !form.formState.errors.root) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Check your email</CardTitle>
              <CardDescription>
                We sent a password reset link to{' '}
                <span className="text-foreground font-medium">
                  {form.getValues('email')}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Click the link in your email to reset your password. If you
                don&apos;t see the email, check your spam folder.
              </p>
              <div className="mt-6 text-center text-sm">
                <Link href="/login" className="underline underline-offset-4">
                  Back to login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Forgot Password</CardTitle>
            <CardDescription>
              Enter your email and we will send you a reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              id="forgot-password-form"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FieldGroup>
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="forgot-password-email">
                        Email
                      </FieldLabel>
                      <Input
                        {...field}
                        id="forgot-password-email"
                        type="email"
                        placeholder="m@example.com"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                {form.formState.errors.root && (
                  <p className="text-destructive-foreground text-sm">
                    {form.formState.errors.root.message}
                  </p>
                )}
              </FieldGroup>
            </form>
            <div className="mt-4 flex flex-col gap-4">
              <Button
                type="submit"
                form="forgot-password-form"
                className="w-full"
                disabled={isPending}
              >
                {isPending ? 'Sending reset link...' : 'Send Reset Link'}
              </Button>
              <p className="text-center text-sm">
                {'Remember your password? '}
                <Link href="/login" className="underline underline-offset-4">
                  Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
