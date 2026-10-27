import type {
  FrontAnyXoBackupJob,
  useXoBackupJobCollection,
} from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { useXoBackupRepositoryForgetJob } from '@/modules/backup-repository/jobs/xo-backup-repository-forget.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import type { fetchPost } from '@/shared/utils/fetch.util.ts'
import { createBr } from '@/test/create-br.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { ref } from 'vue'

const { post, monitorTask, backupJobs } = vi.hoisted(() => ({
  post: vi.fn(),
  monitorTask: vi.fn(),
  backupJobs: { value: [] as unknown[] },
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchPost: post as unknown as typeof fetchPost,
}))

// The task and backup job collections would open SSE subscriptions
vi.mock(import('@/shared/composables/xo-task-utils.composable.ts'), () => ({
  useXoTaskUtils: (() => ({ monitorTask })) as unknown as typeof useXoTaskUtils,
}))

vi.mock(import('@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'), () => ({
  useXoBackupJobCollection: (() => ({
    backupJobs: ref(backupJobs.value),
  })) as unknown as typeof useXoBackupJobCollection,
}))

beforeEach(() => {
  vi.restoreAllMocks()
  post.mockReset()
  monitorTask.mockReset()
  backupJobs.value = []

  post.mockImplementation(async (url: string) => ({ taskId: `task-of-${url}` }))
  monitorTask.mockResolvedValue(undefined)
})

const firstBr = createBr({ id: 'backup-repository-1' as FrontXoBackupRepository['id'] })
const secondBr = createBr({ id: 'backup-repository-2' as FrontXoBackupRepository['id'] })

function createBackupJob(overrides: Record<string, unknown>) {
  return { id: 'backup-job-1', name: 'Backup job', type: 'backup', ...overrides } as unknown as FrontAnyXoBackupJob
}

function mountForgetJob(brs: FrontXoBackupRepository[]) {
  return mountComposable(() => useXoBackupRepositoryForgetJob(() => brs)).wrapper.vm
}

describe('run', () => {
  it('forgets every repository and waits for each task', async () => {
    await mountForgetJob([firstBr, secondBr]).run()

    expect(post.mock.calls).toEqual([
      [`backup-repositories/${firstBr.id}/actions/forget`],
      [`backup-repositories/${secondBr.id}/actions/forget`],
    ])
    expect(monitorTask.mock.calls).toEqual([
      [`task-of-backup-repositories/${firstBr.id}/actions/forget`],
      [`task-of-backup-repositories/${secondBr.id}/actions/forget`],
    ])
  })

  it('reports each repository result, without stopping at the first failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('Backup repository unreachable')
    monitorTask.mockRejectedValueOnce(error)

    const results = await mountForgetJob([firstBr, secondBr]).run()

    expect(results).toEqual([
      { status: 'rejected', reason: error },
      { status: 'fulfilled', value: undefined },
    ])
  })
})

describe('validate', () => {
  it('can run with repositories used by no backup job', () => {
    backupJobs.value = [createBackupJob({ remotes: { id: 'backup-repository-456' } })]

    expect(mountForgetJob([firstBr]).canRun).toBe(true)
  })

  it('cannot run without repository', () => {
    const job = mountForgetJob([])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-repository-forget:missing-backup-repository'))
  })

  it('cannot run when a backup job uses a repository', () => {
    backupJobs.value = [createBackupJob({ remotes: { id: secondBr.id } })]

    const job = mountForgetJob([firstBr, secondBr])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-repository-forget:used-by-n-backup-jobs', { n: 1 }))
  })

  it('counts once a backup job using several of the repositories', () => {
    backupJobs.value = [
      createBackupJob({ id: 'targets-both', remotes: { id: { __or: [firstBr.id, secondBr.id] } } }),
      createBackupJob({
        id: 'mirror',
        type: 'mirrorBackup',
        sourceRemote: firstBr.id,
        remotes: { id: 'backup-repository-456' },
      }),
    ]

    expect(mountForgetJob([firstBr, secondBr]).errorMessage).toBe(
      t('job:backup-repository-forget:used-by-n-backup-jobs', { n: 2 })
    )
  })
})
