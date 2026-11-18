import { useBackupRepositoryForget } from '@/modules/backup-repository/composables/use-backup-repository-forget.composable.ts'
import { useXoBackupRepositoryForgetJob } from '@/modules/backup-repository/jobs/xo-backup-repository-forget.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { t } from '@/test/i18n.ts'
import { overlayMock } from '@/test/mock-overlay.ts'
import { routeQueryMock } from '@/test/mock-route-query.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { type MaybeRefOrGetter, ref } from 'vue'
import type { Router } from 'vue-router'

type ForgetResults = PromiseSettledResult<void>[]

// The job subscribes to server events, unavailable in tests
const forgetJob = createJobStub(useXoBackupRepositoryForgetJob)

mockModule(import('@core/composables/route-query.composable.ts'), () => import('@/test/mock-route-query.ts'))

mockModule(import('@core/packages/overlay/use-overlay.ts'), () => import('@/test/mock-overlay.ts'))

let successHandled: Promise<void> | undefined

beforeEach(() => {
  vi.restoreAllMocks()
  overlayMock.reset()
  forgetJob.reset()
  routeQueryMock.reset()
  successHandled = undefined
})

// The composable runs the job detached: like a successful job, the mock hands the results to `onSuccess`
function mockForgetSuccess(results: ForgetResults, beforeSuccess?: () => void) {
  forgetJob.run.mockImplementation(({ onSuccess }: { onSuccess: (results: ForgetResults) => Promise<void> }) => {
    beforeSuccess?.()
    successHandled = onSuccess(results)
  })
}

const firstBr = createBr({ id: 'backup-repository-1' as FrontXoBackupRepository['id'] })
const secondBr = createBr({ id: 'backup-repository-2' as FrontXoBackupRepository['id'] })

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

  await successHandled
}

async function createRouterOnBrPage(id: FrontXoBackupRepository['id']) {
  const router = createTestRouter()

  await router.push({ name: '/admin/backup-repository/[id]/general', params: { id } })

  return router
}

describe('forgetBackupRepositories', () => {
  it('opens the forget modal for a single repository', () => {
    const { result, forgetModal, typeToConfirmModal } = mountForget([firstBr])

    result.forgetBackupRepositories()

    expect(forgetModal.open).toHaveBeenCalledOnce()
    expect(typeToConfirmModal.open).not.toHaveBeenCalled()
  })

  it('asks to type the number of repositories to confirm for several repositories', () => {
    const { result, forgetModal, typeToConfirmModal } = mountForget([firstBr, secondBr])

    result.forgetBackupRepositories()

    expect(forgetModal.open).not.toHaveBeenCalled()
    expect(typeToConfirmModal.open).toHaveBeenCalledWith({
      props: {
        accent: 'danger',
        icon: 'status:danger-picto',
        title: t('modal:backup-repository-forget-title', { n: 2 }),
        description: t('modal:backup-repository-forget-message', { n: 2 }),
        confirmationText: t('n-brs', { n: 2 }),
        confirmLabel: t('action:forget-n-brs', { n: 2 }),
      },
      events: {
        onConfirm: expect.any(Function),
      },
    })
  })
})

describe('on confirm', () => {
  it('unselects the repository shown in the side panel once forgotten', async () => {
    mockForgetSuccess([
      { status: 'fulfilled', value: undefined },
      { status: 'fulfilled', value: undefined },
    ])
    routeQueryMock.query.value = secondBr.id

    await forgetAndConfirm([firstBr, secondBr])

    expect(routeQueryMock.query.value).toBe('')
  })

  it('keeps the repository shown in the side panel selected when forgetting it failed', async () => {
    mockForgetSuccess([
      { status: 'fulfilled', value: undefined },
      { status: 'rejected', reason: new Error('Backup repository unreachable') },
    ])
    routeQueryMock.query.value = secondBr.id

    await forgetAndConfirm([firstBr, secondBr])

    expect(routeQueryMock.query.value).toBe(secondBr.id)
  })

  it('keeps another repository shown in the side panel selected', async () => {
    mockForgetSuccess([{ status: 'fulfilled', value: undefined }])
    routeQueryMock.query.value = secondBr.id

    await forgetAndConfirm([firstBr])

    expect(routeQueryMock.query.value).toBe(secondBr.id)
  })

  it('runs the job detached so the modal closes right away', async () => {
    await forgetAndConfirm([firstBr])

    expect(forgetJob.run).toHaveBeenCalledWith({ detached: true, onSuccess: expect.any(Function) })
  })

  it('keeps the repository shown in the side panel selected when the job failed', async () => {
    // A failed detached job never calls `onSuccess`
    routeQueryMock.query.value = firstBr.id

    await forgetAndConfirm([firstBr])

    expect(routeQueryMock.query.value).toBe(firstBr.id)
  })

  it('unselects the forgotten repository even when the repositories change during the job', async () => {
    const brs = ref([firstBr, secondBr])
    routeQueryMock.query.value = secondBr.id

    // The forgotten repositories leave the collection before the job is over
    mockForgetSuccess(
      [
        { status: 'fulfilled', value: undefined },
        { status: 'fulfilled', value: undefined },
      ],
      () => {
        brs.value = []
      }
    )

    await forgetAndConfirm(brs)

    expect(routeQueryMock.query.value).toBe('')
  })
})

describe('redirection', () => {
  it('redirects to the repositories list once the repository of the current page is forgotten', async () => {
    mockForgetSuccess([{ status: 'fulfilled', value: undefined }])
    const router = await createRouterOnBrPage(firstBr.id)

    await forgetAndConfirm([firstBr], { router })

    expect(router.currentRoute.value.name).toBe('/admin/backup-and-replication/backup-repositories')
  })

  it('stays on the repository page when forgetting it failed', async () => {
    mockForgetSuccess([{ status: 'rejected', reason: new Error('Backup repository unreachable') }])
    const router = await createRouterOnBrPage(firstBr.id)

    await forgetAndConfirm([firstBr], { router })

    expect(router.currentRoute.value.name).toBe('/admin/backup-repository/[id]/general')
  })

  it('stays on the page of another repository', async () => {
    mockForgetSuccess([{ status: 'fulfilled', value: undefined }])
    const router = await createRouterOnBrPage(secondBr.id)

    await forgetAndConfirm([firstBr], { router })

    expect(router.currentRoute.value.name).toBe('/admin/backup-repository/[id]/general')
  })
})
