import { useXoaRestartXoServerJob } from '@/modules/appliance/jobs/xoa-restart-xo-server.job.ts'
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

function mountRestartJob() {
  return mountComposable(() => useXoaRestartXoServerJob()).wrapper.vm
}

describe('run', () => {
  it('restarts xo-server', async () => {
    await mountRestartJob().run()

    expect(post).toHaveBeenCalledWith('plugins/xoa/actions/restart-xo-server')
  })

  itRejectsWithRequestError('propagates the error of the request', {
    request: post,
    errorMessage: 'restart failed',
    run: () => mountRestartJob().run(),
  })
})

describe('validate', () => {
  itCanRun([{ name: 'can run when no restart is running', mountJob: () => mountRestartJob() }])

  it('cannot run while xo-server is restarting', () => {
    post.mockReturnValue(new Promise(() => {}))
    const job = mountRestartJob()

    expectJobRunning(job, t('job:xoa-restart-xo-server:in-progress'))
  })
})
