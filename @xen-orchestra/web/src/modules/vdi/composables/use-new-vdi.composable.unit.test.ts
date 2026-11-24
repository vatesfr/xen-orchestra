import NewVdiDrawer from '@/modules/vdi/components/drawer/NewVdiDrawer.vue'
import { useNewVdi } from '@/modules/vdi/composables/use-new-vdi.composable.ts'
import { type NewVdiPayload, useXoVdiCreateJob } from '@/modules/vdi/jobs/xo-vdi-create.job.ts'
import { ONE_GB, VDI_SOURCE } from '@/shared/constants.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createVm } from '@/test/create-vm.ts'
import { overlayMock, mockOverlay } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import type { XoSr } from '@vates/types'
import type { Component, Ref } from 'vue'

type OverlayOptions = {
  component: () => Promise<{ default: Component }>
  events: {
    onConfirm: (payload: NewVdiPayload) => unknown
    onCancel: true
  }
}

const createJob = createJobStub(useXoVdiCreateJob)
const { run } = createJob

mockOverlay()

const VM = createVm()

const PAYLOAD: NewVdiPayload = {
  source: VDI_SOURCE.EMPTY,
  srId: 'sr-1' as XoSr['id'],
  name_label: 'VDI',
  virtual_size: 10 * ONE_GB,
  vm: VM.id,
}

beforeEach(() => {
  createJob.reset()
  overlayMock.reset()

  silenceConsoleError()
})

function mountNewVdi() {
  return mountComposable(() => useNewVdi(VM)).wrapper.vm
}

function getJobPayload() {
  return (createJob.use.mock.calls[0] as [Ref<NewVdiPayload | undefined>])[0]
}

function getOverlay() {
  return overlayMock.getOverlay<OverlayOptions>()
}

describe('isCreatingVdi', () => {
  it('is true while the creation runs', () => {
    createJob.setState({ isRunning: true })

    expect(mountNewVdi().isCreatingVdi).toBe(true)
  })
})

describe('openNewVdiDrawer', () => {
  it('opens the VDI drawer on the VM', async () => {
    mountNewVdi().openNewVdiDrawer()

    expect((await getOverlay().component()).default).toBe(NewVdiDrawer)
    expect(getOverlay().open.mock.lastCall?.[0].props).toEqual({ vm: VM })
  })
})

describe('onConfirm', () => {
  it('has no payload before the drawer is confirmed', () => {
    mountNewVdi()

    expect(getJobPayload().value).toBeUndefined()
  })

  it('closes the drawer when it is cancelled', () => {
    mountNewVdi()

    expect(getOverlay().events.onCancel).toBe(true)
  })

  it('runs the job in the background with the confirmed payload, and closes the drawer', () => {
    run.mockImplementation(() => {
      expect(getJobPayload().value).toEqual(PAYLOAD)
    })
    mountNewVdi().openNewVdiDrawer()

    const response = getOverlay().events.onConfirm(PAYLOAD)

    expect(run).toHaveBeenCalledExactlyOnceWith({ detached: true, onSuccess: expect.any(Function) })
    expect(response).toBeUndefined()
  })

  it('logs the failure when the creation is rejected', () => {
    const consoleError = silenceConsoleError()
    run.mockImplementation(({ onSuccess }: { onSuccess: (results: PromiseSettledResult<unknown>[]) => void }) => {
      onSuccess([{ status: 'rejected', reason: new Error('Creation failed') }])
    })
    mountNewVdi().openNewVdiDrawer()

    getOverlay().events.onConfirm(PAYLOAD)

    expect(consoleError).toHaveBeenCalledWith('Failed to create VDI', new Error('Creation failed'))
  })
})
