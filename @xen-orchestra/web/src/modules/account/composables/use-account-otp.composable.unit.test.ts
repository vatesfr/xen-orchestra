import { useAccountOtp } from '@/modules/account/composables/use-account-otp.composable.ts'
import type { EditXoUserPayload, useXoUserEditJob } from '@/modules/user/jobs/xo-user-edit.job.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { createUser } from '@/test/create-user.ts'
import { overlayMock } from '@/test/mock-overlay.ts'
import { xoUserMock } from '@/test/mock-xo-user.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import type { XoUser } from '@vates/types'
import { type Ref, ref } from 'vue'

type OverlayOptions = {
  events: {
    onConfirm: (...args: unknown[]) => Promise<unknown>
    onCancel: true
  }
}

const { useEditJob, run } = vi.hoisted(() => ({
  useEditJob: vi.fn(),
  run: vi.fn(),
}))

vi.mock(import('@/modules/user/jobs/xo-user-edit.job.ts'), () => ({
  useXoUserEditJob: useEditJob as unknown as typeof useXoUserEditJob,
}))

vi.mock(import('@/modules/user/remote-resources/use-xo-user.ts'), () => import('@/test/mock-xo-user.ts'))

vi.mock(import('@core/packages/overlay/use-overlay.ts'), () => import('@/test/mock-overlay.ts'))

beforeEach(() => {
  useEditJob.mockReset().mockReturnValue(createJobResult(run))
  run.mockReset()
  xoUserMock.reset()
  overlayMock.reset()

  silenceConsoleError()
})

function mountOtp(user: XoUser = createUser()) {
  return mountComposable(() => useAccountOtp(user)).wrapper.vm
}

function getJobArgs() {
  const [user, payload] = useEditJob.mock.calls[0] as [Ref<XoUser>, Ref<EditXoUserPayload | undefined>]

  return { user, payload }
}

function getEnableDrawer() {
  return overlayMock.getOverlay<OverlayOptions>(0)
}

function getDisableModal() {
  return overlayMock.getOverlay<OverlayOptions>(1)
}

describe('isOtpEnabled', () => {
  it('is true when the user has an OTP secret', () => {
    expect(mountOtp(createUser({ preferences: { otp: 'SECRET' } })).isOtpEnabled).toBe(true)
  })

  it('is false when the user has no OTP secret', () => {
    expect(mountOtp(createUser({ preferences: {} })).isOtpEnabled).toBe(false)
  })

  it('follows the user', () => {
    const user = ref(createUser())
    const { wrapper } = mountComposable(() => useAccountOtp(user))

    user.value = createUser({ preferences: { otp: 'SECRET' } })

    expect(wrapper.vm.isOtpEnabled).toBe(true)
  })
})

describe('job', () => {
  it('runs on the user', () => {
    const user = createUser({ username: 'jane' })
    mountOtp(user)

    expect(getJobArgs().user.value).toEqual(user)
  })

  it('has no payload before a choice is confirmed', () => {
    mountOtp()

    expect(getJobArgs().payload.value).toBeUndefined()
  })

  it('exposes whether the OTP can be edited, is being edited, and why it cannot be', () => {
    useEditJob.mockReturnValue(createJobResult(run, { canRun: false, isRunning: true, errorMessage: 'In progress' }))

    const result = mountOtp()

    expect(result.canEditOtp).toBe(false)
    expect(result.isEditingOtp).toBe(true)
    expect(result.editOtpErrorMessage).toBe('In progress')
  })
})

describe('enableOtp', () => {
  it('opens the drawer with the user', () => {
    const user = createUser({ username: 'jane' })

    mountOtp(user).enableOtp()

    expect(getEnableDrawer().open).toHaveBeenCalledWith({ props: expect.objectContaining({ user }) })
  })

  it('closes the drawer when it is cancelled', () => {
    mountOtp()

    expect(getEnableDrawer().events.onCancel).toBe(true)
  })

  it('saves the confirmed secret, reloads the user, then closes the drawer', async () => {
    run.mockImplementation(async () => expect(getJobArgs().payload.value).toEqual({ preferences: { otp: 'SECRET' } }))
    mountOtp()

    const response = await getEnableDrawer().events.onConfirm('SECRET')

    expect(run).toHaveBeenCalledOnce()
    expect(xoUserMock.forceReload).toHaveBeenCalledOnce()
    expect(response).toBeUndefined()
  })

  it('keeps the drawer open and does not reload the user when the job fails', async () => {
    run.mockRejectedValue(new Error('Edition failed'))
    mountOtp()

    const response = await getEnableDrawer().events.onConfirm('SECRET')

    expect(response).toBe(KEEP_OVERLAY_OPEN)
    expect(xoUserMock.forceReload).not.toHaveBeenCalled()
  })
})

describe('disableOtp', () => {
  it('opens the confirmation modal', () => {
    mountOtp().disableOtp()

    expect(getDisableModal().open).toHaveBeenCalledOnce()
    expect(getEnableDrawer().open).not.toHaveBeenCalled()
  })

  it('closes the modal when it is cancelled', () => {
    mountOtp()

    expect(getDisableModal().events.onCancel).toBe(true)
  })

  it('removes the OTP secret, reloads the user, then closes the modal', async () => {
    run.mockImplementation(async () => expect(getJobArgs().payload.value).toEqual({ preferences: { otp: null } }))
    mountOtp()

    const response = await getDisableModal().events.onConfirm()

    expect(run).toHaveBeenCalledOnce()
    expect(xoUserMock.forceReload).toHaveBeenCalledOnce()
    expect(response).toBeUndefined()
  })

  it('keeps the modal open and does not reload the user when the job fails', async () => {
    run.mockRejectedValue(new Error('Edition failed'))
    mountOtp()

    const response = await getDisableModal().events.onConfirm()

    expect(response).toBe(KEEP_OVERLAY_OPEN)
    expect(xoUserMock.forceReload).not.toHaveBeenCalled()
  })
})
