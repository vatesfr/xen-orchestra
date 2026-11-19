import { useXoBackupRepositoryBenchmarkJob } from '@/modules/backup-repository/jobs/xo-backup-repository-benchmark.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { createBr, createTwoBrs } from '@/test/create-br.ts'
import { t } from '@/test/i18n.ts'
import { itCannotRun, itMonitorsTaskPerTarget } from '@/test/job-cases.ts'
import { taskUtilsMock } from '@/test/mock-xo-task-utils.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockModule, mockedExport } from '@/test/spy-on-module.ts'

const post = mockedExport(fetchPost)

const { monitorTask } = taskUtilsMock

// The task collection would open an SSE subscription
mockModule(import('@/shared/composables/xo-task-utils.composable.ts'), () => import('@/test/mock-xo-task-utils.ts'))

beforeEach(() => {
  vi.restoreAllMocks()
  taskUtilsMock.reset()

  monitorTask.mockResolvedValue({ writeRate: 100_000_000, readRate: 200_000_000 })
})

const [firstBr, secondBr] = createTwoBrs()

function mountBenchmarkJob(brs: FrontXoBackupRepository[]) {
  return mountComposable(() => useXoBackupRepositoryBenchmarkJob(() => brs)).wrapper.vm
}

describe('run', () => {
  itMonitorsTaskPerTarget({
    name: 'benchmarks every repository and waits for each task',
    post,
    targets: [firstBr, secondBr],
    collection: 'backup-repositories',
    action: 'benchmark',
    subject: 'repository',
    errorMessage: 'Backup repository unreachable',
    run: () => mountBenchmarkJob([firstBr, secondBr]).run(),
    fulfilledValue: { writeRate: 100_000_000, readRate: 200_000_000 },
  })
})

describe('validate', () => {
  it('can run with enabled repositories', () => {
    expect(mountBenchmarkJob([firstBr, secondBr]).canRun).toBe(true)
  })

  itCannotRun([
    {
      name: 'cannot run without repository',
      mountJob: () => mountBenchmarkJob([]),
      errorMessage: t('job:backup-repository-benchmark:missing-backup-repository'),
    },
    {
      name: 'cannot run on a disabled repository',
      mountJob: () => mountBenchmarkJob([createBr({ enabled: false })]),
      errorMessage: t('job:backup-repository-benchmark:repository-disabled'),
    },
    {
      name: 'counts the disabled repositories of a selection',
      mountJob: () =>
        mountBenchmarkJob([
          firstBr,
          createBr({ id: 'backup-repository-3' as FrontXoBackupRepository['id'], enabled: false }),
          createBr({ id: 'backup-repository-4' as FrontXoBackupRepository['id'], enabled: false }),
        ]),
      errorMessage: t('job:backup-repository-benchmark:n-repositories-disabled', { n: 2 }),
    },
  ])
})
