import { useXoAuthenticationTokenForgetJob } from '@/modules/account/jobs/xo-authentication-token-forget.job.ts'
import type { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { createAuthenticationToken } from '@/test/create-authentication-token.ts'
import { t } from '@/test/i18n.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import type { XoAuthenticationToken } from '@vates/types'

const { remove } = vi.hoisted(() => ({ remove: vi.fn() }))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchDelete: remove as unknown as typeof fetchDelete,
}))

beforeEach(() => {
  remove.mockReset()
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'

  remove.mockResolvedValue(undefined)
})

const firstToken = createAuthenticationToken({ id: 'token-1' as XoAuthenticationToken['id'] })
const secondToken = createAuthenticationToken({ id: 'token-2' as XoAuthenticationToken['id'] })

function mountForgetJob(tokens: XoAuthenticationToken[]) {
  return mountComposable(() => useXoAuthenticationTokenForgetJob(() => tokens)).wrapper.vm
}

describe('run', () => {
  it('deletes every token', async () => {
    await mountForgetJob([firstToken, secondToken]).run()

    expect(remove.mock.calls).toEqual([
      ['users/me/authentication_tokens/token-1'],
      ['users/me/authentication_tokens/token-2'],
    ])
  })

  it('reports each token result, without stopping at the first failure', async () => {
    silenceConsoleError()
    const error = new Error('request failed')
    remove.mockRejectedValueOnce(error)

    const results = await mountForgetJob([firstToken, secondToken]).run()

    expect(results).toEqual([
      { status: 'rejected', reason: error },
      { status: 'fulfilled', value: undefined },
    ])
  })
})

describe('validate', () => {
  it('can run with tokens other than the current one', () => {
    document.cookie = 'token=current-token; path=/'

    const job = mountForgetJob([firstToken, secondToken])

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('cannot run without token', () => {
    const job = mountForgetJob([])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:authentication-token-forget:missing-token'))
  })

  it('cannot run when the current session token is selected', () => {
    document.cookie = `token=${secondToken.id}; path=/`

    const job = mountForgetJob([firstToken, secondToken])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:authentication-token-forget:current-session'))
  })

  it('cannot run while tokens are being forgotten', () => {
    remove.mockReturnValue(new Promise(() => {}))

    expectJobRunning(mountForgetJob([firstToken]), t('job:authentication-token-forget:in-progress'))
  })
})
