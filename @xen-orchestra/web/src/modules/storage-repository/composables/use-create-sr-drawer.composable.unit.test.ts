import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useCreateSrDrawer } from '@/modules/storage-repository/composables/use-create-sr-drawer.composable.ts'
import { type NewSrRestPayload, useXoSrCreateJob } from '@/modules/storage-repository/jobs/xo-sr-create.job.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { mockOverlay, overlayMock } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import type { Ref } from 'vue'

type OverlayOptions = {
  events: {
    onConfirm: (payload: NewSrRestPayload) => Promise<unknown>
    onCancel: true
  }
}

const createJob = createJobStub(useXoSrCreateJob)
const { run } = createJob

mockOverlay()

const PAYLOAD: NewSrRestPayload = {
  hostId: 'host-456' as FrontXoHost['id'],
  name_label: 'My SR',
  SR_type: 'ext',
  device_config: { device: '/dev/sdb' },
}

beforeEach(() => {
  createJob.reset()
  overlayMock.reset()

  silenceConsoleError()
})

function mountCreateSrDrawer() {
  return mountComposable(() => useCreateSrDrawer()).wrapper.vm
}

function getJobPayload() {
  return (createJob.use.mock.calls[0] as [Ref<NewSrRestPayload | undefined>])[0]
}

it('has no payload before the drawer is confirmed', () => {
  mountCreateSrDrawer()

  expect(getJobPayload().value).toBeUndefined()
})

it('opens the drawer on the given pool and host', () => {
  const context = { poolId: 'pool-789' as FrontXoPool['id'], hostId: 'host-456' as FrontXoHost['id'] }

  mountCreateSrDrawer().openCreateSrDrawer(context)

  expect(overlayMock.getOverlay().open).toHaveBeenCalledWith({ props: context })
})

it('closes the drawer when it is cancelled', () => {
  mountCreateSrDrawer()

  expect(overlayMock.getOverlay<OverlayOptions>().events.onCancel).toBe(true)
})

describe('onConfirm', () => {
  it('runs the job with the confirmed payload, and closes the drawer once created', async () => {
    run.mockImplementation(async () => {
      expect(getJobPayload().value).toEqual(PAYLOAD)

      return 'sr-new'
    })
    mountCreateSrDrawer()

    const response = await overlayMock.getOverlay<OverlayOptions>().events.onConfirm(PAYLOAD)

    expect(run).toHaveBeenCalledOnce()
    expect(response).toBeUndefined()
  })

  it('keeps the drawer open when the job fails', async () => {
    run.mockRejectedValue(new Error('Job failed'))
    mountCreateSrDrawer()

    expect(await overlayMock.getOverlay<OverlayOptions>().events.onConfirm(PAYLOAD)).toBe(KEEP_OVERLAY_OPEN)
  })
})
