import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateProfile } from '@/actions/profile'
import UserSettingsDialog from '@/components/app-shell/user-settings-dialog'
import { uploadAvatarToCloudinary } from '@/lib/image-upload'
import { createTestProfile } from '@/test/mocks/types'

const refreshAuth = vi.fn()
const profile = createTestProfile()

vi.mock('@/actions/profile', () => ({
  updateProfile: vi.fn(),
}))

vi.mock('@/hooks/use-auth', () => ({
  useRefreshAuth: () => refreshAuth,
}))

vi.mock('@/lib/image-upload', () => ({
  uploadAvatarToCloudinary: vi.fn(),
}))

vi.mock('@/lib/cloudinary', () => ({
  getCloudinaryImageUrl: (publicId: string) =>
    `https://res.cloudinary.com/daystash/image/upload/${publicId}`,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn() },
}))

const mockedUpdateProfile = vi.mocked(updateProfile)
const mockedUploadAvatar = vi.mocked(uploadAvatarToCloudinary)

describe('UserSettingsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUpdateProfile.mockResolvedValue({ success: true })
    mockedUploadAvatar.mockResolvedValue({
      publicId: 'daystash/user-id/avatars/avatar-id',
      width: 512,
      height: 512,
    })
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:avatar-preview'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
  })

  it('updates the name and refreshes the sidebar profile', async () => {
    const actor = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <UserSettingsDialog open onOpenChange={onOpenChange} profile={profile} />
    )

    const name = screen.getByRole('textbox', { name: 'Name' })
    expect(name).toHaveValue('Jamie Doe')
    await actor.clear(name)
    await actor.type(name, 'Jamie Traveller')
    await actor.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() =>
      expect(mockedUpdateProfile).toHaveBeenCalledWith({
        fullName: 'Jamie Traveller',
        avatarUrl: null,
      })
    )
    expect(refreshAuth).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('uploads a selected avatar before updating the profile', async () => {
    const actor = userEvent.setup()
    const avatar = new File(['avatar'], 'avatar.png', { type: 'image/png' })

    render(<UserSettingsDialog open onOpenChange={vi.fn()} profile={profile} />)

    await actor.upload(screen.getByLabelText('Avatar image'), avatar)
    await actor.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() =>
      expect(mockedUploadAvatar).toHaveBeenCalledWith(avatar, 'user-id')
    )
    expect(mockedUpdateProfile).toHaveBeenCalledWith({
      fullName: 'Jamie Doe',
      avatarUrl:
        'https://res.cloudinary.com/daystash/image/upload/daystash/user-id/avatars/avatar-id',
    })
  })

  it('rejects unsupported avatar files', async () => {
    const invalidFile = new File(['avatar'], 'avatar.gif', {
      type: 'image/gif',
    })

    render(<UserSettingsDialog open onOpenChange={vi.fn()} profile={profile} />)

    fireEvent.change(screen.getByLabelText('Avatar image'), {
      target: { files: [invalidFile] },
    })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose a JPG, PNG, or WebP image.'
    )
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
  })
})
