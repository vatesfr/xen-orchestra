import { useXoAuthenticationTokenEditJob } from '@/modules/account/jobs/xo-authentication-token-edit.job.ts'
import type { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { createAuthenticationToken } from '@/test/create-authentication-token.ts'
import { t } from '@/test/i18n.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { XoAuthenticationToken } from '@vates/types'

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

const token = createAuthenticationToken()

function mountEditJob(token: XoAuthenticationToken | undefined) {
  return mountComposable(() => useXoAuthenticationTokenEditJob(token, { description: 'Renamed' })).wrapper.vm
}

describe('run', () => {
  it('patches the token with its new description', async () => {
    await mountEditJob(token).run()

    expect(patch).toHaveBeenCalledWith(`users/me/authentication_tokens/${token.id}`, { description: 'Renamed' })
  })

  it('propagates the error of the request', async () => {
    const error = new Error('request failed')
    patch.mockRejectedValue(error)

    await expect(mountEditJob(token).run()).rejects.toBe(error)
  })
})

describe('validate', () => {
  it('can run with a token', () => {
    const job = mountEditJob(token)

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('cannot run without token', () => {
    const job = mountEditJob(undefined)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:arg:authentication-token-required'))
  })

  it('cannot run while the token is being edited', () => {
    patch.mockReturnValue(new Promise(() => {}))

    expectJobRunning(mountEditJob(token), t('job:edit:in-progress'))
  })
})
