import { useBackupRepositoryForget } from '@/modules/backup-repository/composables/use-backup-repository-forget.composable.ts'
import { useXoBackupRepositoryForgetJob } from '@/modules/backup-repository/jobs/xo-backup-repository-forget.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createTwoBrs } from '@/test/create-br.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import {
  createConfirmedAction,
  createDetachedJobRun,
  itAsksToTypeToConfirm,
  itOpensSingleModal,
  type SelectionJobCase,
  itRedirectsOnSuccess,
  itUnselectsOnSuccess,
} from '@/test/detached-selection-job.ts'
import { t } from '@/test/i18n.ts'
import { overlayMock } from '@/test/mock-overlay.ts'
import { routeQueryMock } from '@/test/mock-route-query.ts'
import { mockModule } from '@/test/spy-on-module.ts'

// The job subscribes to server events, unavailable in tests
const forgetJob = createJobStub(useXoBackupRepositoryForgetJob)
const detachedRun = createDetachedJobRun(forgetJob.run)

mockModule(import('@core/composables/route-query.composable.ts'), () => import('@/test/mock-route-query.ts'))

mockModule(import('@core/packages/overlay/use-overlay.ts'), () => import('@/test/mock-overlay.ts'))

beforeEach(() => {
  vi.restoreAllMocks()
  overlayMock.reset()
  forgetJob.reset()
  routeQueryMock.reset()
})

const [firstBr, secondBr] = createTwoBrs()

const forgetAction = createConfirmedAction({
  use: useBackupRepositoryForget,
  start: result => result.forgetBackupRepositories(),
  detachedRun,
})

const forgetCase: SelectionJobCase<FrontXoBackupRepository> = {
  wording: { item: 'repository', items: 'repositories', done: 'forgotten', doing: 'forgetting' },
  items: [firstBr, secondBr],
  detachedRun,
  confirm: forgetAction.confirm,
  errorMessage: 'Backup repository unreachable',
}

describe('forgetBackupRepositories', () => {
  // The forget modal declares its own props and events
  itOpensSingleModal('opens the forget modal for a single repository', forgetAction, firstBr, [])

  itAsksToTypeToConfirm(
    'asks to type the number of repositories to confirm for several repositories',
    forgetAction,
    [firstBr, secondBr],
    {
      title: t('modal:backup-repository-forget-title', { n: 2 }),
      description: t('modal:backup-repository-forget-message', { n: 2 }),
      confirmationText: t('n-brs', { n: 2 }),
      confirmLabel: t('action:forget-n-brs', { n: 2 }),
    }
  )
})

describe('on confirm', () => {
  itUnselectsOnSuccess(forgetCase)

  it('keeps the repository shown in the side panel selected when the job failed', async () => {
    // A failed detached job never calls `onSuccess`
    routeQueryMock.query.value = firstBr.id

    await forgetAction.confirm([firstBr])

    expect(routeQueryMock.query.value).toBe(firstBr.id)
  })
})

describe('redirection', () => {
  itRedirectsOnSuccess(forgetCase, {
    itemPage: '/admin/backup-repository/[id]/general',
    redirection: {
      to: () => ({ name: '/admin/backup-and-replication/backup-repositories' }),
      wording: 'to the repositories list',
    },
  })
})
