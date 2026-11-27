import { useXoBackupRepositoryReclaimSpaceJob } from '@/modules/backup-repository/jobs/xo-backup-repository-reclaim-space.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { createBr, createTwoBrs } from '@/test/create-br.ts'
import { t } from '@/test/i18n.ts'
import { itCannotRun, itMonitorsTaskPerTarget } from '@/test/job-cases.ts'
import { taskUtilsMock, mockXoTaskUtils } from '@/test/mock-xo-task-utils.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'

const post = mockedExport(fetchPost)

const { monitorTask } = taskUtilsMock

// The task collection would open an SSE subscription
mockXoTaskUtils()

beforeEach(() => {
  vi.restoreAllMocks()
  taskUtilsMock.reset()

  monitorTask.mockResolvedValue([{ success: true, merge: true, size: 0 }])
})

const [firstBr, secondBr] = createTwoBrs()

function mountReclaimSpaceJob(brs: FrontXoBackupRepository[]) {
  return mountComposable(() => useXoBackupRepositoryReclaimSpaceJob(() => brs)).wrapper.vm
}

describe('run', () => {
  itMonitorsTaskPerTarget({
    name: 'reclaims space on every repository and waits for each task',
    post,
    targets: [firstBr, secondBr],
    collection: 'backup-repositories',
    action: 'reclaim-space',
    subject: 'repository',
    errorMessage: 'Reclaim space failed',
    run: () => mountReclaimSpaceJob([firstBr, secondBr]).run(),
    fulfilledValue: [{ success: true, merge: true, size: 0 }],
  })
})

describe('validate', () => {
  it('can run with enabled repositories', () => {
    expect(mountReclaimSpaceJob([firstBr, secondBr]).canRun).toBe(true)
  })

  itCannotRun([
    {
      name: 'cannot run without repository',
      mountJob: () => mountReclaimSpaceJob([]),
      errorMessage: t('job:backup-repository-reclaim-space:missing-backup-repository'),
    },
    {
      name: 'cannot run on a disabled repository',
      mountJob: () => mountReclaimSpaceJob([createBr({ enabled: false })]),
      errorMessage: t('job:backup-repository-reclaim-space:repository-disabled'),
    },
    {
      name: 'counts the disabled repositories of a selection',
      mountJob: () =>
        mountReclaimSpaceJob([
          firstBr,
          createBr({ id: 'backup-repository-3' as FrontXoBackupRepository['id'], enabled: false }),
          createBr({ id: 'backup-repository-4' as FrontXoBackupRepository['id'], enabled: false }),
        ]),
      errorMessage: t('job:backup-repository-reclaim-space:n-repositories-disabled', { n: 2 }),
    },
  ])
})
