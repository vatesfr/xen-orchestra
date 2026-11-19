import {
  type NewAuthenticationTokenPayload,
  useXoAuthenticationTokenCreateJob,
} from '@/modules/account/jobs/xo-authentication-token-create.job.ts'
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

function mountCreateJob(payload: NewAuthenticationTokenPayload) {
  return mountComposable(() => useXoAuthenticationTokenCreateJob(payload)).wrapper.vm
}

describe('run', () => {
  it('creates a token with the description and the expiration', async () => {
    await mountCreateJob({ description: 'CI', expiresIn: 86_400_000 }).run()

    expect(post).toHaveBeenCalledWith('users/me/authentication_tokens', { description: 'CI', expiresIn: 86_400_000 })
  })

  it('propagates the error of the request', async () => {
    const error = new Error('request failed')
    post.mockRejectedValue(error)

    await expect(mountCreateJob({ description: 'CI' }).run()).rejects.toBe(error)
  })
})

describe('validate', () => {
  it('can run', () => {
    const job = mountCreateJob({ description: 'CI' })

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('cannot run while a token is being created', () => {
    post.mockReturnValue(new Promise(() => {}))

    expectJobRunning(mountCreateJob({ description: 'CI' }), t('job:create:in-progress'))
  })
})
