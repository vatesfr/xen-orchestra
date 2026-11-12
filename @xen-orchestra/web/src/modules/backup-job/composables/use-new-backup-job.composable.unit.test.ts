import { useNewBackupJob } from '@/modules/backup-job/composables/use-new-backup-job.composable.ts'
import type {
  NewBackupJobPayload,
  useXoBackupJobCreateJob,
} from '@/modules/backup-job/jobs/xo-backup-job-create.job.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import type { Ref } from 'vue'

type OverlayOptions = {
  events: {
    onConfirm: (payload: NewBackupJobPayload) => Promise<unknown>
    onCancel: true
  }
}

const { useCreateJob, run, useOverlayMock, open } = vi.hoisted(() => ({
  useCreateJob: vi.fn(),
  run: vi.fn(),
  useOverlayMock: vi.fn(),
  open: vi.fn(),
}))

vi.mock(import('@/modules/backup-job/jobs/xo-backup-job-create.job.ts'), () => ({
  useXoBackupJobCreateJob: useCreateJob as unknown as typeof useXoBackupJobCreateJob,
}))

vi.mock(import('@core/packages/overlay/use-overlay.ts'), () => ({
  useOverlay: useOverlayMock as unknown as typeof useOverlay,
}))

const PAYLOAD: NewBackupJobPayload = {
  type: 'metadataBackup',
  name: 'Metadata backup',
  proxy: undefined,
  xoMetadata: true,
  pools: {},
  remotes: {},
  schedules: { schedule: { cron: '0 0 * * *', timezone: 'Europe/Paris', enabled: true } },
  settings: {},
}

beforeEach(() => {
  useCreateJob.mockReset()
  run.mockReset()
  useOverlayMock.mockReset()
  open.mockReset()

  vi.spyOn(console, 'error').mockImplementation(() => {})

  useCreateJob.mockReturnValue({ run })
  useOverlayMock.mockReturnValue({ open, abort: vi.fn() })
})

function mountNewBackupJob() {
  return mountComposable(() => useNewBackupJob()).wrapper.vm
}

function getOverlayOptions(): OverlayOptions {
  return useOverlayMock.mock.calls[0][0]
}

function getJobPayload() {
  return (useCreateJob.mock.calls[0] as [Ref<NewBackupJobPayload | undefined>])[0]
}

it('has no payload before the drawer is confirmed', () => {
  mountNewBackupJob()

  expect(getJobPayload().value).toBeUndefined()
})

it('opens the drawer', () => {
  mountNewBackupJob().openNewBackupJobDrawer()

  expect(open).toHaveBeenCalledOnce()
})

it('closes the drawer when it is cancelled', () => {
  mountNewBackupJob()

  expect(getOverlayOptions().events.onCancel).toBe(true)
})

describe('onConfirm', () => {
  it('runs the job with the confirmed payload, and closes the drawer once created', async () => {
    run.mockImplementation(async () => {
      expect(getJobPayload().value).toEqual(PAYLOAD)

      return 'backup-job-123'
    })
    mountNewBackupJob()

    const response = await getOverlayOptions().events.onConfirm(PAYLOAD)

    expect(run).toHaveBeenCalledOnce()
    expect(response).toBeUndefined()
  })

  it('keeps the drawer open when the job fails', async () => {
    run.mockRejectedValue(new Error('Job failed'))
    mountNewBackupJob()

    expect(await getOverlayOptions().events.onConfirm(PAYLOAD)).toBe(KEEP_OVERLAY_OPEN)
  })
})
