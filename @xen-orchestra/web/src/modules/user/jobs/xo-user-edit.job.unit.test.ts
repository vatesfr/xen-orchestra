import { useXoUserEditJob } from '@/modules/user/jobs/xo-user-edit.job.ts'
import type { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { createUser } from '@/test/create-user.ts'
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

const user = createUser()

function mountEditJob(user: XoUser | undefined, payload = { firstname: 'Jane' }) {
  return mountComposable(() => useXoUserEditJob(user, payload)).wrapper.vm
}

describe('run', () => {
  it('patches the user with the payload', async () => {
    await mountEditJob(user, { username: 'jane', email: 'jane@example.org' }).run()

    expect(patch).toHaveBeenCalledWith(`users/${user.id}`, { username: 'jane', email: 'jane@example.org' })
  })

  it('propagates the error of the request', async () => {
    const error = new Error('request failed')
    patch.mockRejectedValue(error)

    await expect(mountEditJob(user).run()).rejects.toBe(error)
  })
})

describe('validate', () => {
  it('can run with a user', () => {
    const job = mountEditJob(user)

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('cannot run without user', () => {
    const job = mountEditJob(undefined)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:arg:user-required'))
  })

  it('cannot run while the user is being edited', () => {
    patch.mockReturnValue(new Promise(() => {}))

    expectJobRunning(mountEditJob(user), t('job:edit:in-progress'))
  })
})
