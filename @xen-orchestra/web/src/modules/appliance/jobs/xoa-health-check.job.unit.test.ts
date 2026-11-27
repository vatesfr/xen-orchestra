import { useXoaHealthCheckJob } from '@/modules/appliance/jobs/xoa-health-check.job.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { t } from '@/test/i18n.ts'
import { itCanRun, itRejectsWithRequestError } from '@/test/job-cases.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'

const post = mockedExport(fetchPost)

beforeEach(() => {
  post.mockResolvedValue(undefined)
})

function mountHealthCheckJob() {
  return mountComposable(() => useXoaHealthCheckJob()).wrapper.vm
}

describe('run', () => {
  it('runs the health check of the appliance', async () => {
    await mountHealthCheckJob().run()

    expect(post).toHaveBeenCalledWith('plugins/xoa/health-check/actions/run')
  })

  itRejectsWithRequestError('propagates the error of the request', {
    request: post,
    errorMessage: 'health check failed',
    run: () => mountHealthCheckJob().run(),
  })
})

describe('validate', () => {
  itCanRun([{ name: 'can run when no health check is running', mountJob: () => mountHealthCheckJob() }])

  it('cannot run while the health check is running', () => {
    post.mockReturnValue(new Promise(() => {}))
    const job = mountHealthCheckJob()

    expectJobRunning(job, t('job:xoa-health-check:in-progress'))
  })
})
