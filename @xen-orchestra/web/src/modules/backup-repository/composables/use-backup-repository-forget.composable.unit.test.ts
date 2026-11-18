import { useBackupRepositoryForget } from '@/modules/backup-repository/composables/use-backup-repository-forget.composable.ts'
import { useXoBackupRepositoryForgetJob } from '@/modules/backup-repository/jobs/xo-backup-repository-forget.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createTwoBrs } from '@/test/create-br.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import {
  createDetachedJobRun,
  itAsksToTypeToConfirm,
  itRedirectsOnSuccess,
  itUnselectsOnSuccess,
} from '@/test/detached-selection-job.ts'
import { t } from '@/test/i18n.ts'
import { overlayMock } from '@/test/mock-overlay.ts'
import { routeQueryMock } from '@/test/mock-route-query.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import type { MaybeRefOrGetter } from 'vue'
import type { Router } from 'vue-router'

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

function mountForget(brs: MaybeRefOrGetter<FrontXoBackupRepository[]>, { router = createTestRouter() } = {}) {
  const result = mountComposable(() => useBackupRepositoryForget(brs), { router }).wrapper.vm

  // The composable declares the single repository modal first, then the type to confirm one
  const [forgetModal, typeToConfirmModal] = overlayMock.getOverlays()

  return { result, forgetModal, typeToConfirmModal }
}

// Opens the modal matching the repositories count, confirms it, then waits for the success handling
async function forgetAndConfirm(brs: MaybeRefOrGetter<FrontXoBackupRepository[]>, options?: { router?: Router }) {
  const { result } = mountForget(brs, options)

  result.forgetBackupRepositories()

  overlayMock.confirmOpened()

  await detachedRun.settled()
}

const forgetCase = {
  wording: { item: 'repository', items: 'repositories', done: 'forgotten', doing: 'forgetting' },
  items: [firstBr, secondBr] as [FrontXoBackupRepository, FrontXoBackupRepository],
  detachedRun,
  confirm: forgetAndConfirm,
  errorMessage: 'Backup repository unreachable',
}

describe('forgetBackupRepositories', () => {
  it('opens the forget modal for a single repository', () => {
    const { result, forgetModal, typeToConfirmModal } = mountForget([firstBr])

    result.forgetBackupRepositories()

    expect(forgetModal.open).toHaveBeenCalledOnce()
    expect(typeToConfirmModal.open).not.toHaveBeenCalled()
  })

  itAsksToTypeToConfirm(
    'asks to type the number of repositories to confirm for several repositories',
    () => {
      const { result, forgetModal, typeToConfirmModal } = mountForget([firstBr, secondBr])

      result.forgetBackupRepositories()

      return { singleModal: forgetModal, typeToConfirmModal }
    },
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

    await forgetAndConfirm([firstBr])

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
