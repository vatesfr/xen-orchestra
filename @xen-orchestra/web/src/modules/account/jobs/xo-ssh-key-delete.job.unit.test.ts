import { useXoSshKeyDeleteJob } from '@/modules/account/jobs/xo-ssh-key-delete.job.ts'
import type { SshKey } from '@/modules/account/types/ssh-key.type.ts'
import type { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { createUserWithSshKeys } from '@/test/create-user.ts'
import { t } from '@/test/i18n.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { XoUser } from '@vates/types'

const { patch } = vi.hoisted(() => ({
  patch: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchPatch: patch as unknown as typeof fetchPatch,
}))

beforeEach(() => {
  patch.mockReset()

  patch.mockResolvedValue(undefined)
})

const firstKey: SshKey = { title: 'Laptop', key: 'ssh-rsa AAA' }
const secondKey: SshKey = { title: 'Desktop', key: 'ssh-rsa BBB' }
const thirdKey: SshKey = { title: 'Server', key: 'ssh-rsa CCC' }

const user = createUserWithSshKeys([firstKey, secondKey, thirdKey])

function mountDeleteJob(user: XoUser | undefined, sshKeys: SshKey[]) {
  return mountComposable(() => useXoSshKeyDeleteJob(user, sshKeys)).wrapper.vm
}

describe('run', () => {
  it('keeps the keys which are not deleted', async () => {
    await mountDeleteJob(user, [secondKey]).run()

    expect(patch).toHaveBeenCalledWith(`users/${user.id}`, { preferences: { sshKeys: [firstKey, thirdKey] } })
  })

  it('deletes several keys at once', async () => {
    await mountDeleteJob(user, [firstKey, thirdKey]).run()

    expect(patch).toHaveBeenCalledWith(`users/${user.id}`, { preferences: { sshKeys: [secondKey] } })
  })

  it('identifies a key by its public key, not by its title', async () => {
    await mountDeleteJob(user, [{ title: 'Renamed', key: firstKey.key }]).run()

    expect(patch).toHaveBeenCalledWith(`users/${user.id}`, { preferences: { sshKeys: [secondKey, thirdKey] } })
  })
})

describe('validate', () => {
  it('can run with keys', () => {
    const job = mountDeleteJob(user, [firstKey])

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('cannot run without user', () => {
    const job = mountDeleteJob(undefined, [firstKey])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:arg:user-required'))
  })

  it('cannot run without key', () => {
    const job = mountDeleteJob(user, [])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:ssh-key-delete:missing-ssh-key'))
  })

  it('cannot run while keys are being deleted', () => {
    patch.mockReturnValue(new Promise(() => {}))

    expectJobRunning(mountDeleteJob(user, [firstKey]), t('job:delete:in-progress'))
  })
})
