import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { type PoolAddHostPayload, useXoPoolAddHostJob } from '@/modules/pool/jobs/xo-pool-add-host.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import type { fetchPost } from '@/shared/utils/fetch.util.ts'
import { t } from '@/test/i18n.ts'
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

const PAYLOAD: PoolAddHostPayload = {
  poolId: 'pool-1' as FrontXoPool['id'],
  hostId: 'host-1' as FrontXoHost['id'],
}

function mountAddHostJob(payload: PoolAddHostPayload | undefined) {
  return mountComposable(() => useXoPoolAddHostJob(() => payload)).wrapper.vm
}

describe('run', () => {
  it('adds the host to the pool and waits for its task', async () => {
    const results = await mountAddHostJob(PAYLOAD).run()

    expect(post).toHaveBeenCalledWith(`pools/${PAYLOAD.poolId}/actions/add_host`, { host: PAYLOAD.hostId, force: true })
    expect(monitorTask).toHaveBeenCalledWith('task-1')
    expect(results).toEqual([{ status: 'fulfilled', value: undefined }])
  })

  it('reports the failure of the task', async () => {
    const error = new Error('Host is not compatible')
    monitorTask.mockRejectedValueOnce(error)

    const results = await mountAddHostJob(PAYLOAD).run()

    expect(results).toEqual([{ status: 'rejected', reason: error }])
  })
})

describe('validate', () => {
  it('can run with a payload', () => {
    expect(mountAddHostJob(PAYLOAD).canRun).toBe(true)
  })

  it('cannot run without payload', () => {
    const job = mountAddHostJob(undefined)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:arg:missing-payload'))
  })
})
