import { useEditAccount } from '@/modules/account/composables/use-edit-account.composable.ts'
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
    onConfirm: (payload: EditXoUserPayload) => Promise<unknown>
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

const PAYLOAD: EditXoUserPayload = { email: 'jane@example.org', firstname: 'Jane', lastname: 'Doe' }

beforeEach(() => {
  useEditJob.mockReset().mockReturnValue(createJobResult(run))
  run.mockReset()
  xoUserMock.reset()
  overlayMock.reset()

  silenceConsoleError()
})

function mountEditAccount(user: XoUser = createUser()) {
  return mountComposable(() => useEditAccount(user)).wrapper.vm
}

function getJobArgs() {
  const [user, payload] = useEditJob.mock.calls[0] as [Ref<XoUser>, Ref<EditXoUserPayload | undefined>]

  return { user, payload }
}

describe('job', () => {
  it('runs on the user', () => {
    const user = createUser({ username: 'jane' })
    mountEditAccount(user)

    expect(getJobArgs().user.value).toEqual(user)
  })

  it('has no payload before the drawer is confirmed', () => {
    mountEditAccount()

    expect(getJobArgs().payload.value).toBeUndefined()
  })

  it('exposes whether the account can be edited, is being edited, and why it cannot be', () => {
    useEditJob.mockReturnValue(createJobResult(run, { canRun: false, isRunning: true, errorMessage: 'In progress' }))

    const result = mountEditAccount()

    expect(result.canEditAccount).toBe(false)
    expect(result.isEditingAccount).toBe(true)
    expect(result.editAccountErrorMessage).toBe('In progress')
  })
})

describe('editAccount', () => {
  it('opens the drawer with the user', () => {
    const user = createUser({ username: 'jane' })

    mountEditAccount(user).editAccount()

    expect(overlayMock.getOverlay().open).toHaveBeenCalledWith({ props: expect.objectContaining({ user }) })
  })

  it('opens the drawer with the latest user', () => {
    const user = ref(createUser({ username: 'jane' }))
    const { wrapper } = mountComposable(() => useEditAccount(user))
    const updatedUser = createUser({ username: 'jane.doe' })

    user.value = updatedUser
    wrapper.vm.editAccount()

    expect(overlayMock.getOverlay().open).toHaveBeenCalledWith({ props: expect.objectContaining({ user: updatedUser }) })
  })

  it('closes the drawer when it is cancelled', () => {
    mountEditAccount()

    expect(overlayMock.getOverlay<OverlayOptions>().events.onCancel).toBe(true)
  })
})

describe('onConfirm', () => {
  it('runs the job with the confirmed payload, reloads the user, then closes the drawer', async () => {
    run.mockImplementation(async () => expect(getJobArgs().payload.value).toEqual(PAYLOAD))
    mountEditAccount()

    const response = await overlayMock.getOverlay<OverlayOptions>().events.onConfirm(PAYLOAD)

    expect(run).toHaveBeenCalledOnce()
    expect(xoUserMock.forceReload).toHaveBeenCalledOnce()
    expect(response).toBeUndefined()
  })

  it('keeps the drawer open and does not reload the user when the job fails', async () => {
    run.mockRejectedValue(new Error('Edition failed'))
    mountEditAccount()

    const response = await overlayMock.getOverlay<OverlayOptions>().events.onConfirm(PAYLOAD)

    expect(response).toBe(KEEP_OVERLAY_OPEN)
    expect(xoUserMock.forceReload).not.toHaveBeenCalled()
  })
})
