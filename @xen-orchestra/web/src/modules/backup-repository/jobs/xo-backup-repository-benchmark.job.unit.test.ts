import { useXoBackupRepositoryBenchmarkJob } from '@/modules/backup-repository/jobs/xo-backup-repository-benchmark.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import type { fetchPost } from '@/shared/utils/fetch.util.ts'
import { createBr } from '@/test/create-br.ts'
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

  post.mockImplementation(async (url: string) => ({ taskId: `task-of-${url}` }))
  monitorTask.mockResolvedValue({ writeRate: 100_000_000, readRate: 200_000_000 })
})

const firstBr = createBr({ id: 'backup-repository-1' as FrontXoBackupRepository['id'] })
const secondBr = createBr({ id: 'backup-repository-2' as FrontXoBackupRepository['id'] })

function mountBenchmarkJob(brs: FrontXoBackupRepository[]) {
  return mountComposable(() => useXoBackupRepositoryBenchmarkJob(() => brs)).wrapper.vm
}

describe('run', () => {
  it('benchmarks every repository and waits for each task', async () => {
    await mountBenchmarkJob([firstBr, secondBr]).run()

    expect(post.mock.calls).toEqual([
      [`backup-repositories/${firstBr.id}/actions/benchmark`],
      [`backup-repositories/${secondBr.id}/actions/benchmark`],
    ])
    expect(monitorTask.mock.calls).toEqual([
      [`task-of-backup-repositories/${firstBr.id}/actions/benchmark`],
      [`task-of-backup-repositories/${secondBr.id}/actions/benchmark`],
    ])
  })

  it('reports each repository result, without stopping at the first failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('Backup repository unreachable')
    monitorTask.mockRejectedValueOnce(error)

    const results = await mountBenchmarkJob([firstBr, secondBr]).run()

    expect(results).toEqual([
      { status: 'rejected', reason: error },
      { status: 'fulfilled', value: { writeRate: 100_000_000, readRate: 200_000_000 } },
    ])
  })
})

describe('validate', () => {
  it('can run with enabled repositories', () => {
    expect(mountBenchmarkJob([firstBr, secondBr]).canRun).toBe(true)
  })

  it('cannot run without repository', () => {
    const job = mountBenchmarkJob([])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-repository-benchmark:missing-backup-repository'))
  })

  it('cannot run on a disabled repository', () => {
    const job = mountBenchmarkJob([createBr({ enabled: false })])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-repository-benchmark:repository-disabled'))
  })

  it('counts the disabled repositories of a selection', () => {
    const job = mountBenchmarkJob([
      firstBr,
      createBr({ id: 'backup-repository-3' as FrontXoBackupRepository['id'], enabled: false }),
      createBr({ id: 'backup-repository-4' as FrontXoBackupRepository['id'], enabled: false }),
    ])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-repository-benchmark:n-repositories-disabled', { n: 2 }))
  })
})
