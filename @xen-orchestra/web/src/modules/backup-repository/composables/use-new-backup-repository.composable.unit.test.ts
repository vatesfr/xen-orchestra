import { useNewBackupRepository } from '@/modules/backup-repository/composables/use-new-backup-repository.composable.ts'
import type {
  NewBackupRepositoryPayload,
  useXoBackupRepositoryCreateJob,
} from '@/modules/backup-repository/jobs/xo-backup-repository-create.job.ts'
import { overlayMock } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import type { Ref } from 'vue'

type OverlayOptions = {
  events: {
    onConfirm: (payload: NewBackupRepositoryPayload) => Promise<unknown>
    onCancel: true
  }
}

const { useCreateJob, run } = vi.hoisted(() => ({
  useCreateJob: vi.fn(),
  run: vi.fn(),
}))

vi.mock(import('@/modules/backup-repository/jobs/xo-backup-repository-create.job.ts'), () => ({
  useXoBackupRepositoryCreateJob: useCreateJob as unknown as typeof useXoBackupRepositoryCreateJob,
}))

vi.mock(import('@core/packages/overlay/use-overlay.ts'), () => import('@/test/mock-overlay.ts'))

const PAYLOAD: NewBackupRepositoryPayload = {
  name: 'Nightly backups',
  url: 'nfs://192.168.1.10:/exports/backups',
}

beforeEach(() => {
  useCreateJob.mockReset()
  run.mockReset()
  overlayMock.reset()

  silenceConsoleError()

  useCreateJob.mockReturnValue({ run })
})

function mountNewBackupRepository() {
  return mountComposable(() => useNewBackupRepository()).wrapper.vm
}

function getOverlayOptions(): OverlayOptions {
  return overlayMock.getOverlay<OverlayOptions>()
}

function getJobPayload() {
  return (useCreateJob.mock.calls[0] as [Ref<NewBackupRepositoryPayload | undefined>])[0]
}

it('has no payload before the drawer is confirmed', () => {
  mountNewBackupRepository()

  expect(getJobPayload().value).toBeUndefined()
})

it('opens the drawer', () => {
  mountNewBackupRepository().openNewBackupRepositoryDrawer()

  expect(overlayMock.getOverlay().open).toHaveBeenCalledOnce()
})

it('closes the drawer when it is cancelled', () => {
  mountNewBackupRepository()

  expect(getOverlayOptions().events.onCancel).toBe(true)
})

describe('onConfirm', () => {
  it('runs the job with the confirmed payload, and closes the drawer once created', async () => {
    run.mockImplementation(async () => {
      expect(getJobPayload().value).toEqual(PAYLOAD)

      return [{ status: 'fulfilled', value: 'backup-repository-123' }]
    })
    mountNewBackupRepository()

    const response = await getOverlayOptions().events.onConfirm(PAYLOAD)

    expect(run).toHaveBeenCalledOnce()
    expect(response).toBeUndefined()
  })

  it('keeps the drawer open when the creation is rejected', async () => {
    run.mockResolvedValue([{ status: 'rejected', reason: new Error('Creation failed') }])
    mountNewBackupRepository()

    expect(await getOverlayOptions().events.onConfirm(PAYLOAD)).toBe(KEEP_OVERLAY_OPEN)
  })

  it('keeps the drawer open when the job fails', async () => {
    run.mockRejectedValue(new Error('Job failed'))
    mountNewBackupRepository()

    expect(await getOverlayOptions().events.onConfirm(PAYLOAD)).toBe(KEEP_OVERLAY_OPEN)
  })
})
