import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { type PoolAddHostPayload, useXoPoolAddHostJob } from '@/modules/pool/jobs/xo-pool-add-host.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { createPool } from '@/test/create-pool.ts'
import { t } from '@/test/i18n.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { mockXoTaskUtils, taskUtilsMock } from '@/test/mock-xo-task-utils.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'

const post = mockedExport(fetchPost)

const { monitorTask } = taskUtilsMock

// The task collection would open an SSE subscription
mockXoTaskUtils()

beforeEach(() => {
  vi.restoreAllMocks()
  taskUtilsMock.reset()

  post.mockResolvedValue({ taskId: 'task-1' })
})

const POOL = createPool()

const PAYLOAD: PoolAddHostPayload = {
  hostId: 'host-1' as FrontXoHost['id'],
}

function mountAddHostJob(pool: FrontXoPool | undefined, payload: PoolAddHostPayload | undefined) {
  return mountComposable(() =>
    useXoPoolAddHostJob(
      () => pool,
      () => payload
    )
  ).wrapper.vm
}

describe('run', () => {
  it('adds the host to the pool and waits for its task', async () => {
    await mountAddHostJob(POOL, PAYLOAD).run()

    expect(post).toHaveBeenCalledWith(`pools/${POOL.id}/actions/add_host`, { host: PAYLOAD.hostId, force: true })
    expect(monitorTask).toHaveBeenCalledWith('task-1')
  })

  it('reports the failure of the task', async () => {
    const error = new Error('Host is not compatible')
    monitorTask.mockRejectedValueOnce(error)

    await expect(mountAddHostJob(POOL, PAYLOAD).run()).rejects.toBe(error)
  })
})

describe('validate', () => {
  it('can run with a payload', () => {
    expect(mountAddHostJob(POOL, PAYLOAD).canRun).toBe(true)
  })

  it('can run before the drawer is confirmed', () => {
    const job = mountAddHostJob(POOL, undefined)

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('cannot run without pool', () => {
    const job = mountAddHostJob(undefined, PAYLOAD)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:arg:pool-id-required'))
  })

  it('cannot run while a host is being added to the pool', () => {
    monitorTask.mockReturnValue(new Promise(() => {}))
    const job = mountAddHostJob(POOL, PAYLOAD)

    expectJobRunning(job, t('job:pool-add-host:in-progress'))
  })
})
