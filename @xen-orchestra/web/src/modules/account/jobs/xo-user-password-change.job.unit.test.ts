import {
  type ChangeXoUserPasswordPayload,
  useXoUserPasswordChangeJob,
} from '@/modules/account/jobs/xo-user-password-change.job.ts'
import type { fetchPost } from '@/shared/utils/fetch.util.ts'
import { t } from '@/test/i18n.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { mountComposable } from '@/test/mount-composable.ts'

const { post } = vi.hoisted(() => ({
  post: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchPost: post as unknown as typeof fetchPost,
}))

beforeEach(() => {
  post.mockReset()

  post.mockResolvedValue(undefined)
})

function createPayload(overrides: Partial<ChangeXoUserPasswordPayload> = {}): ChangeXoUserPasswordPayload {
  return { oldPassword: 'old-password', newPassword: 'new-password', ...overrides }
}

function mountPasswordChangeJob(payload: ChangeXoUserPasswordPayload | undefined) {
  return mountComposable(() => useXoUserPasswordChangeJob(payload)).wrapper.vm
}

describe('run', () => {
  it('sends the old and the new passwords', async () => {
    await mountPasswordChangeJob(createPayload()).run()

    expect(post).toHaveBeenCalledWith('users/me/password', { oldPassword: 'old-password', newPassword: 'new-password' })
  })

  it('propagates the error of the request', async () => {
    const error = new Error('wrong password')
    post.mockRejectedValue(error)

    await expect(mountPasswordChangeJob(createPayload()).run()).rejects.toBe(error)
  })
})

describe('validate', () => {
  it('can run with both passwords', () => {
    const job = mountPasswordChangeJob(createPayload())

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('can run without payload, the form being validated before', () => {
    expect(mountPasswordChangeJob(undefined).canRun).toBe(true)
  })

  it.each<Partial<ChangeXoUserPasswordPayload>>([{ oldPassword: '' }, { newPassword: '' }])(
    'cannot run with an empty password (%o)',
    overrides => {
      const job = mountPasswordChangeJob(createPayload(overrides))

      expect(job.canRun).toBe(false)
      expect(job.errorMessage).toBe(t('job:arg:password-required'))
    }
  )

  it('cannot run while the password is being changed', () => {
    post.mockReturnValue(new Promise(() => {}))

    expectJobRunning(mountPasswordChangeJob(createPayload()), t('job:password-change:in-progress'))
  })
})
