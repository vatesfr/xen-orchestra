import { useNewSshKey } from '@/modules/account/composables/use-new-ssh-key.composable.ts'
import type { useXoSshKeyCreateJob } from '@/modules/account/jobs/xo-ssh-key-create.job.ts'
import type { SshKey } from '@/modules/account/types/ssh-key.type.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { createUser, createUserWithSshKeys } from '@/test/create-user.ts'
import { overlayMock } from '@/test/mock-overlay.ts'
import { xoUserMock } from '@/test/mock-xo-user.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import type { XoUser } from '@vates/types'
import { type Ref, ref } from 'vue'

type OverlayOptions = {
  events: {
    onConfirm: (payload: SshKey) => Promise<unknown>
    onCancel: true
  }
}

const { useCreateJob, run } = vi.hoisted(() => ({
  useCreateJob: vi.fn(),
  run: vi.fn(),
}))

vi.mock(import('@/modules/account/jobs/xo-ssh-key-create.job.ts'), () => ({
  useXoSshKeyCreateJob: useCreateJob as unknown as typeof useXoSshKeyCreateJob,
}))

vi.mock(import('@/modules/user/remote-resources/use-xo-user.ts'), () => import('@/test/mock-xo-user.ts'))

vi.mock(import('@core/packages/overlay/use-overlay.ts'), () => import('@/test/mock-overlay.ts'))

const PAYLOAD: SshKey = { title: 'Laptop', key: 'ssh-ed25519 AAAA laptop' }

beforeEach(() => {
  useCreateJob.mockReset().mockReturnValue(createJobResult(run))
  run.mockReset()
  xoUserMock.reset()
  overlayMock.reset()

  silenceConsoleError()
})

function mountNewSshKey(user: XoUser | undefined = createUser()) {
  return mountComposable(() => useNewSshKey(user)).wrapper.vm
}

function getJobArgs() {
  const [user, payload] = useCreateJob.mock.calls[0] as [Ref<XoUser | undefined>, Ref<SshKey | undefined>]

  return { user, payload }
}

describe('job', () => {
  it('runs on the user', () => {
    const user = createUser({ username: 'jane' })
    mountNewSshKey(user)

    expect(getJobArgs().user.value).toEqual(user)
  })

  it('has no payload before the drawer is confirmed', () => {
    mountNewSshKey()

    expect(getJobArgs().payload.value).toBeUndefined()
  })
})

describe('openNewSshKeyDrawer', () => {
  it('opens the drawer with the SSH keys of the user', () => {
    const existingSshKeys: SshKey[] = [{ title: 'Desktop', key: 'ssh-ed25519 BBBB desktop' }]

    mountNewSshKey(createUserWithSshKeys(existingSshKeys)).openNewSshKeyDrawer()

    expect(overlayMock.getOverlay().open).toHaveBeenCalledWith({ props: { existingSshKeys } })
  })

  it('opens the drawer without existing SSH keys when the user has none', () => {
    mountNewSshKey(createUser({ preferences: {} })).openNewSshKeyDrawer()

    expect(overlayMock.getOverlay().open).toHaveBeenCalledWith({ props: { existingSshKeys: [] } })
  })

  it('opens the drawer without existing SSH keys while the user is not loaded', () => {
    mountNewSshKey(undefined).openNewSshKeyDrawer()

    expect(overlayMock.getOverlay().open).toHaveBeenCalledWith({ props: { existingSshKeys: [] } })
  })

  it('opens the drawer with the SSH keys of the latest user', () => {
    const user = ref<XoUser | undefined>(undefined)
    const { wrapper } = mountComposable(() => useNewSshKey(user))
    const existingSshKeys: SshKey[] = [{ title: 'Desktop', key: 'ssh-ed25519 BBBB desktop' }]

    user.value = createUserWithSshKeys(existingSshKeys)
    wrapper.vm.openNewSshKeyDrawer()

    expect(overlayMock.getOverlay().open).toHaveBeenCalledWith({ props: { existingSshKeys } })
  })

  it('closes the drawer when it is cancelled', () => {
    mountNewSshKey()

    expect(overlayMock.getOverlay<OverlayOptions>().events.onCancel).toBe(true)
  })
})

describe('onConfirm', () => {
  it('runs the job with the confirmed SSH key, reloads the user, then closes the drawer', async () => {
    run.mockImplementation(async () => expect(getJobArgs().payload.value).toEqual(PAYLOAD))
    mountNewSshKey()

    const response = await overlayMock.getOverlay<OverlayOptions>().events.onConfirm(PAYLOAD)

    expect(run).toHaveBeenCalledOnce()
    expect(xoUserMock.forceReload).toHaveBeenCalledOnce()
    expect(response).toBeUndefined()
  })

  it('keeps the drawer open and does not reload the user when the job fails', async () => {
    run.mockRejectedValue(new Error('Creation failed'))
    mountNewSshKey()

    const response = await overlayMock.getOverlay<OverlayOptions>().events.onConfirm(PAYLOAD)

    expect(response).toBe(KEEP_OVERLAY_OPEN)
    expect(xoUserMock.forceReload).not.toHaveBeenCalled()
  })
})
