import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { type PoolAddHostPayload, useXoPoolAddHostJob } from '@/modules/pool/jobs/xo-pool-add-host.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import type { fetchPost } from '@/shared/utils/fetch.util.ts'
import { t } from '@/test/i18n.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { mountComposable } from '@/test/mount-composable.ts'

const { post, monitorTask } = vi.hoisted(() => ({
  post: vi.fn(),
  monitorTask: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchPost: post as unknown as typeof fetchPost,
}))

// The task collection would open an SSE subscription
vi.mock(import('@/shared/composables/xo-task-utils.composable.ts'), () => ({
  useXoTaskUtils: (() => ({ monitorTask })) as unknown as typeof useXoTaskUtils,
}))

beforeEach(() => {
  vi.restoreAllMocks()
  post.mockReset()
  monitorTask.mockReset()

  post.mockResolvedValue({ taskId: 'task-1' })
  monitorTask.mockResolvedValue(undefined)
})

const POOL_ID = 'pool-1' as FrontXoPool['id']

const PAYLOAD: PoolAddHostPayload = {
  hostId: 'host-1' as FrontXoHost['id'],
}

function mountAddHostJob(poolId: FrontXoPool['id'] | undefined, payload: PoolAddHostPayload | undefined) {
  return mountComposable(() =>
    useXoPoolAddHostJob(
      () => poolId,
      () => payload
    )
  ).wrapper.vm
}

describe('run', () => {
  it('adds the host to the pool and waits for its task', async () => {
    await mountAddHostJob(POOL_ID, PAYLOAD).run()

    expect(post).toHaveBeenCalledWith(`pools/${POOL_ID}/actions/add_host`, { host: PAYLOAD.hostId, force: true })
    expect(monitorTask).toHaveBeenCalledWith('task-1')
  })

  it('reports the failure of the task', async () => {
    const error = new Error('Host is not compatible')
    monitorTask.mockRejectedValueOnce(error)

    await expect(mountAddHostJob(POOL_ID, PAYLOAD).run()).rejects.toBe(error)
  })
})

describe('validate', () => {
  it('can run with a payload', () => {
    expect(mountAddHostJob(POOL_ID, PAYLOAD).canRun).toBe(true)
  })

  it('can run before the drawer is confirmed', () => {
    const job = mountAddHostJob(POOL_ID, undefined)

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
    const job = mountAddHostJob(POOL_ID, PAYLOAD)

    expectJobRunning(job, t('job:pool-add-host:in-progress'))
  })
})
