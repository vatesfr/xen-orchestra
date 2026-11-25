import NewNetworkDrawer from '@/modules/network/components/drawer/NewNetworkDrawer.vue'
import { useNewNetwork } from '@/modules/network/composables/use-new-network.composable.ts'
import { type NewNetworkPayload, useXoNetworkCreateJob } from '@/modules/network/jobs/xo-network-create.job.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createPool } from '@/test/create-pool.ts'
import { overlayMock, mockOverlay } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import type { XoPif } from '@vates/types'
import type { Component, Ref } from 'vue'

type OverlayOptions = {
  component: () => Promise<{ default: Component }>
  events: {
    onConfirm: (payload: NewNetworkPayload) => unknown
    onCancel: true
  }
}

const createJob = createJobStub(useXoNetworkCreateJob)
const { run } = createJob

mockOverlay()

const POOL = createPool()

const PAYLOAD: NewNetworkPayload = {
  poolId: POOL.id,
  name: 'Network',
  pif: 'pif-1' as XoPif['id'],
  vlan: 10,
}

beforeEach(() => {
  createJob.reset()
  overlayMock.reset()

  silenceConsoleError()
})

function mountNewNetwork() {
  return mountComposable(() => useNewNetwork(POOL)).wrapper.vm
}

function getJobPayload() {
  return (createJob.use.mock.calls[0] as [Ref<NewNetworkPayload | undefined>])[0]
}

function getOverlay() {
  return overlayMock.getOverlay<OverlayOptions>()
}

describe('isCreatingNetwork', () => {
  it('is true while the creation runs', () => {
    createJob.setState({ isRunning: true })

    expect(mountNewNetwork().isCreatingNetwork).toBe(true)
  })
})

describe('openNewNetworkDrawer', () => {
  it('opens the network drawer on the pool', async () => {
    mountNewNetwork().openNewNetworkDrawer()

    expect((await getOverlay().component()).default).toBe(NewNetworkDrawer)
    expect(getOverlay().open.mock.lastCall?.[0].props).toEqual({ poolId: POOL.id })
  })
})

describe('onConfirm', () => {
  it('has no payload before the drawer is confirmed', () => {
    mountNewNetwork()

    expect(getJobPayload().value).toBeUndefined()
  })

  it('closes the drawer when it is cancelled', () => {
    mountNewNetwork()

    expect(getOverlay().events.onCancel).toBe(true)
  })

  it('runs the job in the background with the confirmed payload, and closes the drawer', () => {
    run.mockImplementation(() => {
      expect(getJobPayload().value).toEqual(PAYLOAD)
    })
    mountNewNetwork().openNewNetworkDrawer()

    const response = getOverlay().events.onConfirm(PAYLOAD)

    expect(run).toHaveBeenCalledExactlyOnceWith({ detached: true, onSuccess: expect.any(Function) })
    expect(response).toBeUndefined()
  })

  it('logs the failure when the creation is rejected', () => {
    const consoleError = silenceConsoleError()
    run.mockImplementation(({ onSuccess }: { onSuccess: (results: PromiseSettledResult<unknown>[]) => void }) => {
      onSuccess([{ status: 'rejected', reason: new Error('Creation failed') }])
    })
    mountNewNetwork().openNewNetworkDrawer()

    getOverlay().events.onConfirm(PAYLOAD)

    expect(consoleError).toHaveBeenCalledWith('Failed to create network', new Error('Creation failed'))
  })
})
