'use client'

import { useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { register } from '@/actions/auth'
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

const signUpSchema = z
  .object({
    full_name: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    verify_password: z.string(),
  })
  .refine((data) => data.password === data.verify_password, {
    message: 'Passwords do not match',
    path: ['verify_password'],
  })

type SignUpSchema = z.infer<typeof signUpSchema>

export default function SignUpPage() {
  const [isPending, startTransition] = useTransition()

  const form = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      verify_password: '',
    },
  })

  const onSubmit = (data: SignUpSchema) => {
    startTransition(async () => {
      const result = await register(data)
      if (result?.error) {
        form.setError('root', { message: result.error })
      }
    })
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign Up</CardTitle>
            <CardDescription>
              Create your account to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="signup-form" onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Controller
                  name="full_name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="signup-full-name">
                        Full Name
                      </FieldLabel>
                      <Input
                        {...field}
                        id="signup-full-name"
                        placeholder="John Doe"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="signup-email">Email</FieldLabel>
                      <Input
                        {...field}
                        id="signup-email"
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
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="signup-password">
                        Password
                      </FieldLabel>
                      <Input
                        {...field}
                        id="signup-password"
                        type="password"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="verify_password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="signup-verify-password">
                        Verify Password
                      </FieldLabel>
                      <Input
                        {...field}
                        id="signup-verify-password"
                        type="password"
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
                form="signup-form"
                className="w-full"
                disabled={isPending}
              >
                {isPending ? 'Creating account...' : 'Sign Up'}
              </Button>
              <p className="text-center text-sm">
                {'Already have an account? '}
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
