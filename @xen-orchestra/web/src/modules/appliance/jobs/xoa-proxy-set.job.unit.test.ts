import { useXoaProxySetJob } from '@/modules/appliance/jobs/xoa-proxy-set.job.ts'
import type { XoaProxyPayload } from '@/modules/appliance/types/xoa-proxy.type.ts'
import { fetchPut } from '@/shared/utils/fetch.util.ts'
import { t } from '@/test/i18n.ts'
import { itCanRun, itCannotRun, itRejectsWithRequestError } from '@/test/job-cases.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'

const put = mockedExport(fetchPut)

beforeEach(() => {
  put.mockResolvedValue(undefined)
})

const payload: XoaProxyPayload = {
  host: 'proxy.example.org',
  port: 3128,
  username: 'admin',
  password: 'secret',
}

function mountSetJob(proxyPayload: XoaProxyPayload | undefined) {
  return mountComposable(() => useXoaProxySetJob(proxyPayload)).wrapper.vm
}

describe('run', () => {
  it('saves the proxy of the appliance', async () => {
    await mountSetJob(payload).run()

    expect(put).toHaveBeenCalledWith('plugins/xoa/proxy', payload)
  })

  itRejectsWithRequestError('propagates the error of the request', {
    request: put,
    errorMessage: 'invalid proxy',
    run: () => mountSetJob(payload).run(),
  })
})

describe('validate', () => {
  itCanRun([{ name: 'can run with a host', mountJob: () => mountSetJob(payload) }])

  itCannotRun([
    {
      name: 'cannot run without payload',
      mountJob: () => mountSetJob(undefined),
      errorMessage: t('job:arg:missing-payload'),
    },
    {
      name: 'cannot run without host',
      mountJob: () => mountSetJob({ ...payload, host: '' }),
      errorMessage: t('job:arg:host-required'),
    },
  ])

  it('cannot run while the proxy is being saved', () => {
    put.mockReturnValue(new Promise(() => {}))
    const job = mountSetJob(payload)

    expectJobRunning(job, t('job:edit:in-progress'))
  })
})
