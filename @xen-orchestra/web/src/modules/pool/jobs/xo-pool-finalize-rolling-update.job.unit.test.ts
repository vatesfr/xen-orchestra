import { useXoPoolFinalizeRollingUpdateJob } from '@/modules/pool/jobs/xo-pool-finalize-rolling-update.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { createPool } from '@/test/create-pool.ts'
import { t } from '@/test/i18n.ts'
import { itCanRun, itCannotRun, itRejectsWithRequestError } from '@/test/job-cases.ts'
import { answerPostsWithTask, mockXoTaskUtils, taskUtilsMock } from '@/test/mock-xo-task-utils.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'
import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

const fetchPostMock = mockedExport(fetchPost)

const { monitorTask: monitorTaskMock } = taskUtilsMock

// The task collection would open an SSE subscription
mockXoTaskUtils()

function mountJob(pool: FrontXoPool | undefined, force = false) {
  const { wrapper } = mountComposable(() => useXoPoolFinalizeRollingUpdateJob(() => pool, ref(force)))

  return wrapper.vm
}

beforeEach(() => {
  taskUtilsMock.reset()

  answerPostsWithTask(fetchPostMock)
})

describe('validate', () => {
  itCanRun([{ name: 'can run for a pool', mountJob: () => mountJob(createPool()) }])

  itCannotRun([
    {
      name: 'cannot run without pool',
      mountJob: () => mountJob(undefined),
      errorMessage: t('job:pool-rolling-update:missing-pool'),
    },
  ])

  it('reports a close in progress while its task is not settled', async () => {
    monitorTaskMock.mockReturnValue(new Promise(() => {}))

    const job = mountJob(createPool())

    void job.run()
    await flushPromises()

    expect(job.canRun).toBe(false)
    expect(job.isRunning).toBe(true)
    expect(job.errorMessage).toBe(t('job:pool-finalize-rolling-update:in-progress'))
  })
})

describe('run', () => {
  it.each([true, false])('posts force=%s to the finalize_rolling_update action and waits for the task', async force => {
    const pool = createPool()

    await mountJob(pool, force).run()

    expect(fetchPostMock).toHaveBeenCalledWith(`pools/${pool.id}/actions/finalize_rolling_update`, { force })
    expect(monitorTaskMock).toHaveBeenCalledWith(`task-of-pools/${pool.id}/actions/finalize_rolling_update`)
  })

  itRejectsWithRequestError('rejects when the task fails', {
    request: monitorTaskMock,
    errorMessage: 'items are left to restore',
    run: () => mountJob(createPool()).run(),
  })
})
