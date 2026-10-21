import { useBackupRepositoryForget } from '@/modules/backup-repository/composables/use-backup-repository-forget.composable.ts'
import type { useXoBackupRepositoryForgetJob } from '@/modules/backup-repository/jobs/xo-backup-repository-forget.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { useRouteQuery } from '@core/composables/route-query.composable.ts'
import type { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { type MaybeRefOrGetter, ref } from 'vue'
import type { Router } from 'vue-router'

type OverlayEvents = { onConfirm?: () => void }

type ForgetResults = PromiseSettledResult<void>[]

type MockedOverlay = { open: ReturnType<typeof vi.fn>; events: OverlayEvents }

const { overlays, run, selectedBrId } = vi.hoisted(() => ({
  overlays: [] as MockedOverlay[],
  run: vi.fn(),
  selectedBrId: { value: '' },
}))

// The job subscribes to server events, unavailable in tests
vi.mock(import('@/modules/backup-repository/jobs/xo-backup-repository-forget.job.ts'), () => ({
  useXoBackupRepositoryForgetJob: (() => ({
    run,
    canRun: ref(true),
    isRunning: ref(false),
    errorMessage: ref(undefined),
  })) as unknown as typeof useXoBackupRepositoryForgetJob,
}))

vi.mock(import('@core/composables/route-query.composable.ts'), () => ({
  useRouteQuery: (() => selectedBrId) as unknown as typeof useRouteQuery,
}))

vi.mock(import('@core/packages/overlay/use-overlay.ts'), () => ({
  useOverlay: (({ events }: Pick<MockedOverlay, 'events'>) => {
    const overlay = { open: vi.fn(), events }

    overlays.push(overlay)

    return { open: overlay.open }
  }) as unknown as typeof useOverlay,
}))

let successHandled: Promise<void> | undefined

beforeEach(() => {
  vi.restoreAllMocks()
  overlays.length = 0
  run.mockReset()
  selectedBrId.value = ''
  successHandled = undefined
})

// The composable runs the job detached: like a successful job, the mock hands the results to `onSuccess`
function mockForgetSuccess(results: ForgetResults, beforeSuccess?: () => void) {
  run.mockImplementation(({ onSuccess }: { onSuccess: (results: ForgetResults) => Promise<void> }) => {
    beforeSuccess?.()
    successHandled = onSuccess(results)
  })
}

const firstBr = createBr({ id: 'backup-repository-1' as FrontXoBackupRepository['id'] })
const secondBr = createBr({ id: 'backup-repository-2' as FrontXoBackupRepository['id'] })

function mountForget(brs: MaybeRefOrGetter<FrontXoBackupRepository[]>, { router = createTestRouter() } = {}) {
  const result = mountComposable(() => useBackupRepositoryForget(brs), { router }).wrapper.vm

  // The composable declares the single repository modal first, then the type to confirm one
  const [forgetModal, typeToConfirmModal] = overlays

  return { result, forgetModal, typeToConfirmModal }
}

// Opens the modal matching the repositories count, confirms it, then waits for the success handling
async function forgetAndConfirm(brs: MaybeRefOrGetter<FrontXoBackupRepository[]>, options?: { router?: Router }) {
  const { result } = mountForget(brs, options)

  result.forgetBackupRepositories()

  const openedModal = overlays.find(overlay => overlay.open.mock.calls.length > 0)

  // The events can be declared with the modal, or given when opening it
  const openEvents: OverlayEvents | undefined = openedModal?.open.mock.lastCall?.[0]?.events

  ;(openEvents?.onConfirm ?? openedModal?.events.onConfirm)?.()

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
    selectedBrId.value = secondBr.id

    await forgetAndConfirm([firstBr, secondBr])

    expect(selectedBrId.value).toBe('')
  })

  it('keeps the repository shown in the side panel selected when forgetting it failed', async () => {
    mockForgetSuccess([
      { status: 'fulfilled', value: undefined },
      { status: 'rejected', reason: new Error('Backup repository unreachable') },
    ])
    selectedBrId.value = secondBr.id

    await forgetAndConfirm([firstBr, secondBr])

    expect(selectedBrId.value).toBe(secondBr.id)
  })

  it('keeps another repository shown in the side panel selected', async () => {
    mockForgetSuccess([{ status: 'fulfilled', value: undefined }])
    selectedBrId.value = secondBr.id

    await forgetAndConfirm([firstBr])

    expect(selectedBrId.value).toBe(secondBr.id)
  })

  it('runs the job detached so the modal closes right away', async () => {
    await forgetAndConfirm([firstBr])

    expect(run).toHaveBeenCalledWith({ detached: true, onSuccess: expect.any(Function) })
  })

  it('keeps the repository shown in the side panel selected when the job failed', async () => {
    // A failed detached job never calls `onSuccess`
    selectedBrId.value = firstBr.id

    await forgetAndConfirm([firstBr])

    expect(selectedBrId.value).toBe(firstBr.id)
  })

  it('unselects the forgotten repository even when the repositories change during the job', async () => {
    const brs = ref([firstBr, secondBr])
    selectedBrId.value = secondBr.id

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

    expect(selectedBrId.value).toBe('')
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
