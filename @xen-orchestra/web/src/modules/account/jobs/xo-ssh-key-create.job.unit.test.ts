import { useXoSshKeyCreateJob } from '@/modules/account/jobs/xo-ssh-key-create.job.ts'
import type { SshKey } from '@/modules/account/types/ssh-key.type.ts'
import type { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { createUser, createUserWithSshKeys } from '@/test/create-user.ts'
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

const existingKey: SshKey = { title: 'Laptop', key: 'ssh-rsa AAA' }
const newKey: SshKey = { title: 'Desktop', key: 'ssh-rsa BBB' }

function mountCreateJob(user: XoUser | undefined, sshKey: SshKey | undefined = newKey) {
  return mountComposable(() => useXoSshKeyCreateJob(user, sshKey)).wrapper.vm
}

describe('run', () => {
  it('adds the key after the existing ones', async () => {
    const user = createUserWithSshKeys([existingKey])

    await mountCreateJob(user).run()

    expect(patch).toHaveBeenCalledWith(`users/${user.id}`, { preferences: { sshKeys: [existingKey, newKey] } })
  })

  it('adds the key to a user without SSH keys', async () => {
    const user = createUser()

    await mountCreateJob(user).run()

    expect(patch).toHaveBeenCalledWith(`users/${user.id}`, { preferences: { sshKeys: [newKey] } })
  })
})

describe('validate', () => {
  it('can run with a new key', () => {
    const job = mountCreateJob(createUserWithSshKeys([existingKey]))

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('can run without key, the form being validated before', () => {
    expect(mountCreateJob(createUser(), undefined).canRun).toBe(true)
  })

  it('cannot run without user', () => {
    const job = mountCreateJob(undefined)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:arg:user-required'))
  })

  it('cannot run with an empty key', () => {
    const job = mountCreateJob(createUser(), { title: 'Empty', key: '' })

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:ssh-key-create:key-required'))
  })

  it('cannot run with a key the user already has', () => {
    const job = mountCreateJob(createUserWithSshKeys([existingKey]), { title: 'Other title', key: existingKey.key })

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:ssh-key-create:key-already-exists'))
  })

  it('cannot run while a key is being added', () => {
    patch.mockReturnValue(new Promise(() => {}))

    expectJobRunning(mountCreateJob(createUser()), t('job:create:in-progress'))
  })
})
