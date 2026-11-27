import { useXoaSnapshotJob } from '@/modules/appliance/jobs/xoa-snapshot.job.ts'
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

function mountSnapshotJob() {
  return mountComposable(() => useXoaSnapshotJob()).wrapper.vm
}

describe('run', () => {
  it('snapshots the XOA VM and waits for the task', async () => {
    await mountSnapshotJob().run()

    expect(post).toHaveBeenCalledWith('plugins/xoa/actions/snapshot')
    expect(monitorTask).toHaveBeenCalledWith('task-of-plugins/xoa/actions/snapshot')
  })

  itRejectsWithRequestError('propagates the error of the request', {
    request: post,
    errorMessage: 'snapshot not started',
    run: () => mountSnapshotJob().run(),
    expectAfter: () => expect(monitorTask).not.toHaveBeenCalled(),
  })

  itRejectsWithRequestError('fails when the snapshot task fails', {
    request: monitorTask,
    errorMessage: 'snapshot failed',
    run: () => mountSnapshotJob().run(),
  })
})

describe('validate', () => {
  itCanRun([{ name: 'can run when no snapshot is running', mountJob: () => mountSnapshotJob() }])

  it('cannot run while the snapshot is running', () => {
    post.mockReturnValue(new Promise(() => {}))
    const job = mountSnapshotJob()

    expectJobRunning(job, t('job:xoa-snapshot:in-progress'))
  })
})
