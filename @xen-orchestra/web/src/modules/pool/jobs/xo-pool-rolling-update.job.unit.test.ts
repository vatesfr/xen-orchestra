import { useXoPoolRollingUpdateJob } from '@/modules/pool/jobs/xo-pool-rolling-update.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { RollingUpdateStartOptions } from '@/modules/pool/utils/rolling-update.util.ts'
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

function mountJob(pool: FrontXoPool | undefined, options?: RollingUpdateStartOptions) {
  const { wrapper } = mountComposable(() => useXoPoolRollingUpdateJob(() => pool, ref(options)))

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

  it('reports a rolling update in progress while its request is pending', async () => {
    fetchPostMock.mockReturnValue(new Promise(() => {}))

    const job = mountJob(createPool())

    void job.run()
    await flushPromises()

    expect(job.canRun).toBe(false)
    expect(job.isRunning).toBe(true)
    expect(job.errorMessage).toBe(t('job:pool-rolling-update:in-progress'))
  })
})

describe('run', () => {
  it('posts the options to the rolling_update action, without waiting for the task', async () => {
    const pool = createPool()
    const options = { shutdownPinnedVms: true }

    await mountJob(pool, options).run()

    expect(fetchPostMock).toHaveBeenCalledWith(`pools/${pool.id}/actions/rolling_update`, options)
    expect(monitorTaskMock).not.toHaveBeenCalled()
  })

  it('posts no body when no option is selected', async () => {
    const pool = createPool()

    await mountJob(pool).run()

    expect(fetchPostMock).toHaveBeenCalledWith(`pools/${pool.id}/actions/rolling_update`, undefined)
  })

  itRejectsWithRequestError('rejects when the request is refused', {
    request: fetchPostMock,
    errorMessage: 'a rolling pool update is already running',
    run: () => mountJob(createPool()).run(),
  })
})
