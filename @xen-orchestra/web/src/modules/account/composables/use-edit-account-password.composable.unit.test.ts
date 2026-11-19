import { useEditAccountPassword } from '@/modules/account/composables/use-edit-account-password.composable.ts'
import type {
  ChangeXoUserPasswordPayload,
  useXoUserPasswordChangeJob,
} from '@/modules/account/jobs/xo-user-password-change.job.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { overlayMock } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import type { Ref } from 'vue'

type OverlayOptions = {
  events: {
    onConfirm: (payload: ChangeXoUserPasswordPayload) => Promise<unknown>
    onCancel: true
  }
}

const { useChangeJob, run } = vi.hoisted(() => ({
  useChangeJob: vi.fn(),
  run: vi.fn(),
}))

vi.mock(import('@/modules/account/jobs/xo-user-password-change.job.ts'), () => ({
  useXoUserPasswordChangeJob: useChangeJob as unknown as typeof useXoUserPasswordChangeJob,
}))

vi.mock(import('@core/packages/overlay/use-overlay.ts'), () => import('@/test/mock-overlay.ts'))

const PAYLOAD: ChangeXoUserPasswordPayload = { oldPassword: 'old-password', newPassword: 'new-password' }

beforeEach(() => {
  useChangeJob.mockReset().mockReturnValue(createJobResult(run))
  run.mockReset()
  overlayMock.reset()

  silenceConsoleError()
})

function mountEditPassword() {
  return mountComposable(() => useEditAccountPassword()).wrapper.vm
}

function getJobPayload() {
  return (useChangeJob.mock.calls[0] as [Ref<ChangeXoUserPasswordPayload | undefined>])[0]
}

it('has no payload before the drawer is confirmed', () => {
  mountEditPassword()

  expect(getJobPayload().value).toBeUndefined()
})

it('exposes whether the password can be changed, is being changed, and why it cannot be', () => {
  useChangeJob.mockReturnValue(createJobResult(run, { canRun: false, isRunning: true, errorMessage: 'In progress' }))

  const result = mountEditPassword()

  expect(result.canEditAccountPassword).toBe(false)
  expect(result.isEditingAccountPassword).toBe(true)
  expect(result.editAccountPasswordErrorMessage).toBe('In progress')
})

it('opens the drawer', () => {
  mountEditPassword().editAccountPassword()

  expect(overlayMock.getOverlay().open).toHaveBeenCalledOnce()
})

it('closes the drawer when it is cancelled', () => {
  mountEditPassword()

  expect(overlayMock.getOverlay<OverlayOptions>().events.onCancel).toBe(true)
})

describe('onConfirm', () => {
  it('runs the job with the confirmed payload, then closes the drawer', async () => {
    run.mockImplementation(async () => expect(getJobPayload().value).toEqual(PAYLOAD))
    mountEditPassword()

    const response = await overlayMock.getOverlay<OverlayOptions>().events.onConfirm(PAYLOAD)

    expect(run).toHaveBeenCalledOnce()
    expect(response).toBeUndefined()
  })

  it('keeps the drawer open when the job fails', async () => {
    run.mockRejectedValue(new Error('Wrong password'))
    mountEditPassword()

    const response = await overlayMock.getOverlay<OverlayOptions>().events.onConfirm(PAYLOAD)

    expect(response).toBe(KEEP_OVERLAY_OPEN)
  })
})
