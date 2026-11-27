import { useXoaProxyRemoveJob } from '@/modules/appliance/jobs/xoa-proxy-remove.job.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { t } from '@/test/i18n.ts'
import { itCanRun, itRejectsWithRequestError } from '@/test/job-cases.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'

const del = mockedExport(fetchDelete)

beforeEach(() => {
  del.mockResolvedValue(undefined)
})

function mountRemoveJob() {
  return mountComposable(() => useXoaProxyRemoveJob()).wrapper.vm
}

describe('run', () => {
  it('removes the proxy of the appliance', async () => {
    await mountRemoveJob().run()

    expect(del).toHaveBeenCalledWith('plugins/xoa/proxy')
  })

  itRejectsWithRequestError('propagates the error of the request', {
    request: del,
    errorMessage: 'proxy not removed',
    run: () => mountRemoveJob().run(),
  })
})

describe('validate', () => {
  itCanRun([{ name: 'can run when no removal is running', mountJob: () => mountRemoveJob() }])

  it('cannot run while the proxy is being removed', () => {
    del.mockReturnValue(new Promise(() => {}))
    const job = mountRemoveJob()

    expectJobRunning(job, t('job:delete:in-progress'))
  })
})
