import { useXoPoolRestoreRollingUpdateItemJob } from '@/modules/pool/jobs/xo-pool-restore-rolling-update-item.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { createPool } from '@/test/create-pool.ts'
import { t } from '@/test/i18n.ts'
import { itCanRun, itCannotRun, itRejectsWithRequestError } from '@/test/job-cases.ts'
import { answerPostsWithTask, mockXoTaskUtils, taskUtilsMock } from '@/test/mock-xo-task-utils.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'
import type { PoolRollingUpdateRecoveryUnrestoredItem } from '@vates/types'
import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

const fetchPostMock = mockedExport(fetchPost)

const { monitorTask: monitorTaskMock } = taskUtilsMock

// The task collection would open an SSE subscription
mockXoTaskUtils()

const item: PoolRollingUpdateRecoveryUnrestoredItem = {
  type: 'schedule',
  id: 'schedule-1',
  name: 'nightly',
  restorable: true,
}

// An explicit `undefined` must reach the job, so the item is passed through an object rather than a parameter with a
// default value, which `undefined` would trigger
function mountJob(
  pool: FrontXoPool | undefined,
  { item: itemToRestore }: { item: PoolRollingUpdateRecoveryUnrestoredItem | undefined } = { item }
) {
  const { wrapper } = mountComposable(() => useXoPoolRestoreRollingUpdateItemJob(() => pool, ref(itemToRestore)))

  return wrapper.vm
}

beforeEach(() => {
  taskUtilsMock.reset()

  answerPostsWithTask(fetchPostMock)
})

describe('validate', () => {
  itCanRun([
    { name: 'can run for a pool', mountJob: () => mountJob(createPool()) },
    {
      name: 'can run before an item is chosen',
      mountJob: () => mountJob(createPool(), { item: undefined }),
    },
  ])

  itCannotRun([
    {
      name: 'cannot run without pool',
      mountJob: () => mountJob(undefined),
      errorMessage: t('job:pool-rolling-update:missing-pool'),
    },
  ])

  it('reports a restore in progress while its task is not settled', async () => {
    monitorTaskMock.mockReturnValue(new Promise(() => {}))

    const job = mountJob(createPool())

    void job.run()
    await flushPromises()

    expect(job.canRun).toBe(false)
    expect(job.isRunning).toBe(true)
    expect(job.errorMessage).toBe(t('job:pool-restore-rolling-update-item:in-progress'))
  })
})

describe('run', () => {
  it('posts the type and the id of the item to the restore_rolling_update_item action and waits for the task', async () => {
    const pool = createPool()

    await mountJob(pool).run()

    expect(fetchPostMock).toHaveBeenCalledWith(`pools/${pool.id}/actions/restore_rolling_update_item`, {
      type: item.type,
      id: item.id,
    })
    expect(monitorTaskMock).toHaveBeenCalledWith(`task-of-pools/${pool.id}/actions/restore_rolling_update_item`)
  })

  it('rejects before posting when there is no item', async () => {
    const job = mountJob(createPool(), { item: undefined })

    await expect(job.run()).rejects.toThrow(t('job:pool-restore-rolling-update-item:missing-item'))
    expect(fetchPostMock).not.toHaveBeenCalled()
  })

  itRejectsWithRequestError('rejects when the task fails', {
    request: monitorTaskMock,
    errorMessage: 'the item cannot be restored',
    run: () => mountJob(createPool()).run(),
  })
})
