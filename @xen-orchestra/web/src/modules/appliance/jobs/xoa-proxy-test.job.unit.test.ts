import { useXoaProxyTestJob } from '@/modules/appliance/jobs/xoa-proxy-test.job.ts'
import type { XoaProxyPayload } from '@/modules/appliance/types/xoa-proxy.type.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { t } from '@/test/i18n.ts'
import { itCanRun, itCannotRun, itRejectsWithRequestError } from '@/test/job-cases.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'

const post = mockedExport(fetchPost)

beforeEach(() => {
  post.mockResolvedValue({ ok: true })
})

const payload: XoaProxyPayload = {
  host: 'proxy.example.org',
  port: 3128,
}

function mountTestJob(proxyPayload: XoaProxyPayload | undefined) {
  return mountComposable(() => useXoaProxyTestJob(proxyPayload)).wrapper.vm
}

describe('run', () => {
  it('tests the proxy with the payload', async () => {
    await mountTestJob(payload).run()

    expect(post).toHaveBeenCalledWith('plugins/xoa/proxy/actions/test', payload)
  })

  it('returns the result of the test', async () => {
    const result = { ok: false, error: 'connection refused' }
    post.mockResolvedValue(result)

    await expect(mountTestJob(payload).run()).resolves.toEqual(result)
  })

  itRejectsWithRequestError('propagates the error of the request', {
    request: post,
    errorMessage: 'proxy unreachable',
    run: () => mountTestJob(payload).run(),
  })
})

describe('validate', () => {
  itCanRun([{ name: 'can run with a host', mountJob: () => mountTestJob(payload) }])

  itCannotRun([
    {
      name: 'cannot run without payload',
      mountJob: () => mountTestJob(undefined),
      errorMessage: t('job:arg:missing-payload'),
    },
    {
      name: 'cannot run without host',
      mountJob: () => mountTestJob({ ...payload, host: '' }),
      errorMessage: t('job:arg:host-required'),
    },
  ])

  it('cannot run while the proxy is being tested', () => {
    post.mockReturnValue(new Promise(() => {}))
    const job = mountTestJob(payload)

    expectJobRunning(job, t('job:xoa-test-proxy:in-progress'))
  })
})
