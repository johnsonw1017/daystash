'use client'

import { useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updatePassword } from '@/actions/auth'
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

const updatePasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    verify_password: z.string(),
  })
  .refine((data) => data.password === data.verify_password, {
    message: 'Passwords do not match',
    path: ['verify_password'],
  })

type UpdatePasswordSchema = z.infer<typeof updatePasswordSchema>

const UpdatePasswordPage = () => {
  const [isPending, startTransition] = useTransition()

  const form = useForm<UpdatePasswordSchema>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      verify_password: '',
    },
  })

  const onSubmit = (data: UpdatePasswordSchema) => {
    startTransition(async () => {
      const result = await updatePassword(data)
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
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              id="update-password-form"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FieldGroup>
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="update-password">
                        New Password
                      </FieldLabel>
                      <Input
                        {...field}
                        id="update-password"
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
                      <FieldLabel htmlFor="update-verify-password">
                        Confirm New Password
                      </FieldLabel>
                      <Input
                        {...field}
                        id="update-verify-password"
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
            <div className="mt-4">
              <Button
                type="submit"
                form="update-password-form"
                className="w-full"
                disabled={isPending}
              >
                {isPending ? 'Updating password...' : 'Update Password'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default UpdatePasswordPage
