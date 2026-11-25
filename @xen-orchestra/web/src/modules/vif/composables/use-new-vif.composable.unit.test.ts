import NewVifDrawer from '@/modules/vif/components/drawer/NewVifDrawer.vue'
import { useNewVif } from '@/modules/vif/composables/use-new-vif.composable.ts'
import { type NewVifPayload, useXoVifCreateJob } from '@/modules/vif/jobs/xo-vif-create.job.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createVm } from '@/test/create-vm.ts'
import { overlayMock, mockOverlay } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import type { XoNetwork } from '@vates/types'
import type { Component, Ref } from 'vue'

type OverlayOptions = {
  component: () => Promise<{ default: Component }>
  events: {
    onConfirm: (payload: NewVifPayload) => unknown
    onCancel: true
  }
}

const createJob = createJobStub(useXoVifCreateJob)
const { run } = createJob

mockOverlay()

const VM = createVm()

const PAYLOAD: NewVifPayload = {
  vmId: VM.id,
  networkId: 'network-1' as XoNetwork['id'],
  other_config: { 'ethtool-tx': 'true' },
}

beforeEach(() => {
  createJob.reset()
  overlayMock.reset()

  silenceConsoleError()
})

function mountNewVif() {
  return mountComposable(() => useNewVif(VM)).wrapper.vm
}

function getJobPayload() {
  return (createJob.use.mock.calls[0] as [Ref<NewVifPayload | undefined>])[0]
}

function getOverlay() {
  return overlayMock.getOverlay<OverlayOptions>()
}

describe('isCreatingVif', () => {
  it('is true while the creation runs', () => {
    createJob.setState({ isRunning: true })

    expect(mountNewVif().isCreatingVif).toBe(true)
  })
})

describe('openNewVifDrawer', () => {
  it('opens the VIF drawer on the VM and its pool', async () => {
    mountNewVif().openNewVifDrawer()

    expect((await getOverlay().component()).default).toBe(NewVifDrawer)
    expect(getOverlay().open.mock.lastCall?.[0].props).toEqual({ vmId: VM.id, poolId: VM.$pool })
  })
})

describe('onConfirm', () => {
  it('has no payload before the drawer is confirmed', () => {
    mountNewVif()

    expect(getJobPayload().value).toBeUndefined()
  })

  it('closes the drawer when it is cancelled', () => {
    mountNewVif()

    expect(getOverlay().events.onCancel).toBe(true)
  })

  it('runs the job in the background with the confirmed payload, and closes the drawer', () => {
    run.mockImplementation(() => {
      expect(getJobPayload().value).toEqual(PAYLOAD)
    })
    mountNewVif().openNewVifDrawer()

    const response = getOverlay().events.onConfirm(PAYLOAD)

    expect(run).toHaveBeenCalledExactlyOnceWith({ detached: true, onSuccess: expect.any(Function) })
    expect(response).toBeUndefined()
  })

  it('logs the failure when the creation is rejected', () => {
    const consoleError = silenceConsoleError()
    run.mockImplementation(({ onSuccess }: { onSuccess: (results: PromiseSettledResult<unknown>[]) => void }) => {
      onSuccess([{ status: 'rejected', reason: new Error('Creation failed') }])
    })
    mountNewVif().openNewVifDrawer()

    getOverlay().events.onConfirm(PAYLOAD)

    expect(consoleError).toHaveBeenCalledWith('Failed to create VIF', new Error('Creation failed'))
  })
})
