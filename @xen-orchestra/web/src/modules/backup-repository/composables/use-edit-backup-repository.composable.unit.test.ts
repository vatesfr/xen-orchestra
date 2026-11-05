import { useEditBackupRepository } from '@/modules/backup-repository/composables/use-edit-backup-repository.composable.ts'
import type {
  EditBackupRepositoryPayload,
  useXoBackupRepositoryEditJob,
} from '@/modules/backup-repository/jobs/xo-backup-repository-edit.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { type Ref, ref } from 'vue'

type OverlayOptions = {
  events: {
    onConfirm: (payload: EditBackupRepositoryPayload) => Promise<unknown>
    onCancel: true
  }
}

const { useEditJob, run, useOverlayMock, open } = vi.hoisted(() => ({
  useEditJob: vi.fn(),
  run: vi.fn(),
  useOverlayMock: vi.fn(),
  open: vi.fn(),
}))

vi.mock(import('@/modules/backup-repository/jobs/xo-backup-repository-edit.job.ts'), () => ({
  useXoBackupRepositoryEditJob: useEditJob as unknown as typeof useXoBackupRepositoryEditJob,
}))

vi.mock(import('@core/packages/overlay/use-overlay.ts'), () => ({
  useOverlay: useOverlayMock as unknown as typeof useOverlay,
}))

const PAYLOAD: EditBackupRepositoryPayload = {
  name: 'Weekly backups',
  url: 'nfs://192.168.1.20:/exports/backups',
  options: null,
  proxy: null,
}

beforeEach(() => {
  useEditJob.mockReset()
  run.mockReset()
  useOverlayMock.mockReset()
  open.mockReset()

  vi.spyOn(console, 'error').mockImplementation(() => {})

  useEditJob.mockReturnValue({
    run,
    canRun: ref(true),
    isRunning: ref(false),
    errorMessage: ref(undefined),
  })

  useOverlayMock.mockReturnValue({ open, abort: vi.fn() })
})

function mountEditBackupRepository(br: FrontXoBackupRepository = createBr()) {
  return mountComposable(() => useEditBackupRepository(br)).wrapper.vm
}

function getOverlayOptions(): OverlayOptions {
  return useOverlayMock.mock.calls[0][0]
}

function getJobArgs() {
  const [br, payload] = useEditJob.mock.calls[0] as [Ref<FrontXoBackupRepository>, Ref<EditBackupRepositoryPayload>]

  return { br, payload }
}

describe('job', () => {
  it('runs on the repository', () => {
    const br = createBr({ name: 'Nightly backups' })
    mountEditBackupRepository(br)

    expect(getJobArgs().br.value).toEqual(br)
  })

  it('has no payload before the drawer is confirmed', () => {
    mountEditBackupRepository()

    expect(getJobArgs().payload.value).toBeUndefined()
  })

  it('exposes whether the repository can be edited, is being edited, and why it cannot be', () => {
    useEditJob.mockReturnValue({
      run,
      canRun: ref(false),
      isRunning: ref(true),
      errorMessage: ref('Edition in progress'),
    })

    const result = mountEditBackupRepository()

    expect(result.canEditBackupRepository).toBe(false)
    expect(result.isEditingBackupRepository).toBe(true)
    expect(result.editBackupRepositoryErrorMessage).toBe('Edition in progress')
  })
})

describe('editBackupRepository', () => {
  it('opens the drawer with the repository', () => {
    const br = createBr({ name: 'Nightly backups' })

    mountEditBackupRepository(br).editBackupRepository()

    expect(open).toHaveBeenCalledWith({ props: expect.objectContaining({ br }) })
  })

  it('closes the drawer when it is cancelled', () => {
    mountEditBackupRepository()

    expect(getOverlayOptions().events.onCancel).toBe(true)
  })
})

describe('onConfirm', () => {
  it('runs the job with the confirmed payload, then closes the drawer', async () => {
    run.mockImplementation(async () => expect(getJobArgs().payload.value).toEqual(PAYLOAD))
    mountEditBackupRepository()

    const response = await getOverlayOptions().events.onConfirm(PAYLOAD)

    expect(run).toHaveBeenCalledOnce()
    expect(response).toBeUndefined()
  })

  it('keeps the drawer open when the job fails', async () => {
    run.mockRejectedValue(new Error('Edition failed'))
    mountEditBackupRepository()

    const response = await getOverlayOptions().events.onConfirm(PAYLOAD)

    expect(response).toBe(KEEP_OVERLAY_OPEN)
  })
})
