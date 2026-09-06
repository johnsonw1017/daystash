'use client'

import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { updateProfile } from '@/actions/profile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useRefreshAuth } from '@/hooks/use-auth'
import { getCloudinaryImageUrl } from '@/lib/cloudinary'
import { uploadAvatarToCloudinary } from '@/lib/image-upload'
import type { AuthProfile } from '@/lib/atoms/auth'

const MAX_AVATAR_SOURCE_SIZE = 10 * 1024 * 1024
const acceptedAvatarTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

const settingsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or fewer'),
})

type SettingsValues = z.infer<typeof settingsSchema>

type UserSettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: AuthProfile
}

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

const UserSettingsDialog = ({
  open,
  onOpenChange,
  profile,
}: UserSettingsDialogProps) => {
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const refreshAuth = useRefreshAuth()
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { fullName: profile.full_name },
  })

  useEffect(() => {
    if (!open) return

    form.reset({ fullName: profile.full_name })
    setAvatarFile(null)
    setAvatarError(null)
  }, [form, open, profile.full_name])

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(avatarFile)
    setAvatarPreviewUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [avatarFile])

  const isSaving = form.formState.isSubmitting
  const currentName = form.watch('fullName').trim() || profile.full_name
  const avatarUrl = avatarPreviewUrl ?? profile.avatar_url

  const selectAvatar = (file: File | undefined) => {
    setAvatarError(null)

    if (!file) {
      setAvatarFile(null)
      return
    }

    if (!acceptedAvatarTypes.has(file.type)) {
      setAvatarError('Choose a JPG, PNG, or WebP image.')
      return
    }

    if (file.size > MAX_AVATAR_SOURCE_SIZE) {
      setAvatarError('Choose an image smaller than 10 MB.')
      return
    }

    setAvatarFile(file)
  }

  const onSubmit = async ({ fullName }: SettingsValues) => {
    try {
      let nextAvatarUrl = profile.avatar_url

      if (avatarFile) {
        const uploadedAvatar = await uploadAvatarToCloudinary(
          avatarFile,
          profile.id
        )
        nextAvatarUrl = getCloudinaryImageUrl(uploadedAvatar.publicId)

        if (!nextAvatarUrl) {
          throw new Error('Cloudinary is not configured')
        }
      }

      const result = await updateProfile({
        fullName,
        avatarUrl: nextAvatarUrl,
      })

      if (result.error) {
        form.setError('root', { message: result.error })
        return
      }

      await refreshAuth()
      toast.success('Profile updated')
      onOpenChange(false)
    } catch {
      form.setError('root', {
        message: 'Your profile could not be updated. Please try again.',
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSaving) onOpenChange(nextOpen)
      }}
    >
      <DialogContent showCloseButton={!isSaving}>
        <DialogHeader>
          <DialogTitle>Profile settings</DialogTitle>
        </DialogHeader>

        <form
          id="profile-settings-form"
          className="space-y-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="flex items-center gap-4">
            <Avatar className="size-20">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
              <AvatarFallback className="text-lg">
                {getInitials(currentName)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => avatarInputRef.current?.click()}
              >
                <Camera />
                Choose avatar
              </Button>
              <Input
                ref={avatarInputRef}
                type="file"
                aria-label="Avatar image"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={isSaving}
                onChange={(event) => selectAvatar(event.target.files?.[0])}
              />
              <p className="text-muted-foreground text-xs">
                JPG, PNG, or WebP up to 10 MB.
              </p>
              {avatarError && (
                <p role="alert" className="text-destructive text-sm">
                  {avatarError}
                </p>
              )}
            </div>
          </div>

          <Controller
            name="fullName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="profile-full-name">Name</FieldLabel>
                <Input
                  {...field}
                  id="profile-full-name"
                  autoComplete="name"
                  disabled={isSaving}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {form.formState.errors.root && (
            <p role="alert" className="text-destructive text-sm">
              {form.formState.errors.root.message}
            </p>
          )}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="profile-settings-form"
            disabled={isSaving || Boolean(avatarError)}
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UserSettingsDialog
