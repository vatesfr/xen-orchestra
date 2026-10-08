import { useBackupRepositoryForget } from '@/modules/backup-repository/composables/use-backup-repository-forget.composable.ts'
import type { useXoBackupRepositoryForgetJob } from '@/modules/backup-repository/jobs/xo-backup-repository-forget.job.ts'
import type {
  FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { useRouteQuery } from '@core/composables/route-query.composable.ts'
import type { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'

type MockedOverlay = { open: ReturnType<typeof vi.fn>; events: { onConfirm: () => Promise<void> } }

const { overlays, run, forceReload, selectedBrId } = vi.hoisted(() => ({
  overlays: [] as MockedOverlay[],
  run: vi.fn(),
  forceReload: vi.fn(),
  selectedBrId: { value: '' },
}))

// The job and the collection subscribe to server events, unavailable in tests
vi.mock(import('@/modules/backup-repository/jobs/xo-backup-repository-forget.job.ts'), () => ({
  useXoBackupRepositoryForgetJob: (() => ({
    run,
    canRun: ref(true),
    isRunning: ref(false),
    errorMessage: ref(undefined),
  })) as unknown as typeof useXoBackupRepositoryForgetJob,
}))

vi.mock(import('@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'), () => ({
  useXoBackupRepositoryCollection: (() => ({
    $context: { forceReload },
  })) as unknown as typeof useXoBackupRepositoryCollection,
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

beforeEach(() => {
  vi.restoreAllMocks()
  overlays.length = 0
  run.mockReset()
  forceReload.mockReset()
  selectedBrId.value = ''
})

const firstBr = createBr({ id: 'backup-repository-1' as FrontXoBackupRepository['id'] })
const secondBr = createBr({ id: 'backup-repository-2' as FrontXoBackupRepository['id'] })

function mountForget(brs: FrontXoBackupRepository[]) {
  const result = mountComposable(() => useBackupRepositoryForget(brs)).wrapper.vm

  // The composable declares the single repository modal first, then the type to confirm one
  const [forgetModal, typeToConfirmModal] = overlays

  return { result, forgetModal, typeToConfirmModal }
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
        title: t('modal:backup-repository-forget-n-title', { n: 2 }),
        description: t('modal:backup-repository-forget-n-message'),
        confirmationText: t('n-brs', { n: 2 }),
        confirmLabel: t('action:forget-n-brs', { n: 2 }),
      },
    })
  })
})

describe('on confirm', () => {
  it('reloads the repositories once forgotten', async () => {
    run.mockResolvedValue([{ status: 'fulfilled', value: undefined }])
    const { forgetModal } = mountForget([firstBr])

    await forgetModal.events.onConfirm()

    expect(forceReload).toHaveBeenCalledOnce()
  })

  it('unselects the repository shown in the side panel once forgotten', async () => {
    run.mockResolvedValue([
      { status: 'fulfilled', value: undefined },
      { status: 'fulfilled', value: undefined },
    ])
    selectedBrId.value = secondBr.id
    const { typeToConfirmModal } = mountForget([firstBr, secondBr])

    await typeToConfirmModal.events.onConfirm()

    expect(selectedBrId.value).toBe('')
  })

  it('keeps the repository shown in the side panel selected when forgetting it failed', async () => {
    run.mockResolvedValue([
      { status: 'fulfilled', value: undefined },
      { status: 'rejected', reason: new Error('Backup repository unreachable') },
    ])
    selectedBrId.value = secondBr.id
    const { typeToConfirmModal } = mountForget([firstBr, secondBr])

    await typeToConfirmModal.events.onConfirm()

    expect(selectedBrId.value).toBe(secondBr.id)
  })

  it('keeps another repository shown in the side panel selected', async () => {
    run.mockResolvedValue([{ status: 'fulfilled', value: undefined }])
    selectedBrId.value = secondBr.id
    const { forgetModal } = mountForget([firstBr])

    await forgetModal.events.onConfirm()

    expect(selectedBrId.value).toBe(secondBr.id)
  })

  it('does not reload the repositories when the job cannot run', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    run.mockRejectedValue(new Error('Backup repository used by 1 backup job'))
    const { forgetModal } = mountForget([firstBr])

    await expect(forgetModal.events.onConfirm()).resolves.toBeUndefined()
    expect(forceReload).not.toHaveBeenCalled()
  })
})
