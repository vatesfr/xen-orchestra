import type {
  FrontAnyXoBackupJob,
  useXoBackupJobCollection,
} from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { useXoBackupRepositoryForgetJob } from '@/modules/backup-repository/jobs/xo-backup-repository-forget.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { createTwoBrs } from '@/test/create-br.ts'
import { t } from '@/test/i18n.ts'
import { itCannotRun, itMonitorsTaskPerTarget } from '@/test/job-cases.ts'
import { taskUtilsMock, mockXoTaskUtils } from '@/test/mock-xo-task-utils.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockModule, mockedExport } from '@/test/spy-on-module.ts'
import { ref } from 'vue'

const post = mockedExport(fetchPost)

const backupJobs = { value: [] as unknown[] }

// The task and backup job collections would open SSE subscriptions
mockXoTaskUtils()

mockModule(import('@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'), () => ({
  useXoBackupJobCollection: (() => ({
    backupJobs: ref(backupJobs.value),
  })) as unknown as typeof useXoBackupJobCollection,
}))

beforeEach(() => {
  vi.restoreAllMocks()
  taskUtilsMock.reset()
  backupJobs.value = []
})

const [firstBr, secondBr] = createTwoBrs()

function createBackupJob(overrides: Record<string, unknown>) {
  return { id: 'backup-job-1', name: 'Backup job', type: 'backup', ...overrides } as unknown as FrontAnyXoBackupJob
}

function mountForgetJob(brs: FrontXoBackupRepository[]) {
  return mountComposable(() => useXoBackupRepositoryForgetJob(() => brs)).wrapper.vm
}

describe('run', () => {
  itMonitorsTaskPerTarget({
    name: 'forgets every repository and waits for each task',
    post,
    targets: [firstBr, secondBr],
    collection: 'backup-repositories',
    action: 'forget',
    subject: 'repository',
    errorMessage: 'Backup repository unreachable',
    run: () => mountForgetJob([firstBr, secondBr]).run(),
  })
})

describe('validate', () => {
  it('can run with repositories used by no backup job', () => {
    backupJobs.value = [createBackupJob({ remotes: { id: 'backup-repository-456' } })]

    expect(mountForgetJob([firstBr]).canRun).toBe(true)
  })

  itCannotRun([
    {
      name: 'cannot run without repository',
      mountJob: () => mountForgetJob([]),
      errorMessage: t('job:backup-repository-forget:missing-backup-repository'),
    },
    {
      name: 'cannot run when a backup job uses a repository',
      mountJob: () => {
        backupJobs.value = [createBackupJob({ remotes: { id: secondBr.id } })]

        return mountForgetJob([firstBr, secondBr])
      },
      errorMessage: t('job:backup-repository-forget:used-by-n-backup-jobs', { n: 1 }),
    },
  ])

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
