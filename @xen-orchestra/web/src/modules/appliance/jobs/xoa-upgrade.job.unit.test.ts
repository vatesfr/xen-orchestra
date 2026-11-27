import { useXoaUpgradeJob } from '@/modules/appliance/jobs/xoa-upgrade.job.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { t } from '@/test/i18n.ts'
import { itCanRun, itRejectsWithRequestError } from '@/test/job-cases.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { answerPostsWithTask, mockXoTaskUtils, taskUtilsMock } from '@/test/mock-xo-task-utils.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'

const post = mockedExport(fetchPost)

const { monitorTask } = taskUtilsMock

// The task collection would open an SSE subscription
mockXoTaskUtils()

beforeEach(() => {
  taskUtilsMock.reset()

  answerPostsWithTask(post)
})

function mountUpgradeJob() {
  return mountComposable(() => useXoaUpgradeJob()).wrapper.vm
}

describe('run', () => {
  it('installs the update and waits for the task', async () => {
    await mountUpgradeJob().run()

    expect(post).toHaveBeenCalledWith('plugins/xoa/updates/actions/upgrade')
    expect(monitorTask).toHaveBeenCalledWith('task-of-plugins/xoa/updates/actions/upgrade')
  })

  itRejectsWithRequestError('propagates the error of the request', {
    request: post,
    errorMessage: 'upgrade not started',
    run: () => mountUpgradeJob().run(),
    expectAfter: () => expect(monitorTask).not.toHaveBeenCalled(),
  })

  itRejectsWithRequestError('fails when the upgrade task fails', {
    request: monitorTask,
    errorMessage: 'upgrade failed',
    run: () => mountUpgradeJob().run(),
  })
})

describe('validate', () => {
  itCanRun([{ name: 'can run when no upgrade is running', mountJob: () => mountUpgradeJob() }])

  it('cannot run while the upgrade is running', () => {
    post.mockReturnValue(new Promise(() => {}))
    const job = mountUpgradeJob()

    expectJobRunning(job, t('job:xoa-upgrade:in-progress'))
  })
})
