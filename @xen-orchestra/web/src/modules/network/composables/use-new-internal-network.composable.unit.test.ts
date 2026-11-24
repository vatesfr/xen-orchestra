import NewInternalNetworkDrawer from '@/modules/network/components/drawer/NewInternalNetworkDrawer.vue'
import { useNewInternalNetwork } from '@/modules/network/composables/use-new-internal-network.composable.ts'
import {
  type NewInternalNetworkPayload,
  useXoInternalNetworkCreateJob,
} from '@/modules/network/jobs/xo-internal-network-create.job.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createPool } from '@/test/create-pool.ts'
import { overlayMock, mockOverlay } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import type { Component, Ref } from 'vue'

type OverlayOptions = {
  component: () => Promise<{ default: Component }>
  events: {
    onConfirm: (payload: NewInternalNetworkPayload) => unknown
    onCancel: true
  }
}

const createJob = createJobStub(useXoInternalNetworkCreateJob)
const { run } = createJob

mockOverlay()

const POOL = createPool()

const PAYLOAD: NewInternalNetworkPayload = { poolId: POOL.id, name: 'Internal network' }

beforeEach(() => {
  createJob.reset()
  overlayMock.reset()

  silenceConsoleError()
})

function mountNewInternalNetwork() {
  return mountComposable(() => useNewInternalNetwork(POOL)).wrapper.vm
}

function getJobPayload() {
  return (createJob.use.mock.calls[0] as [Ref<NewInternalNetworkPayload | undefined>])[0]
}

function getOverlay() {
  return overlayMock.getOverlay<OverlayOptions>()
}

describe('isCreatingInternalNetwork', () => {
  it('is true while the creation runs', () => {
    createJob.setState({ isRunning: true })

    expect(mountNewInternalNetwork().isCreatingInternalNetwork).toBe(true)
  })
})

describe('openNewInternalNetworkDrawer', () => {
  it('opens the internal network drawer on the pool', async () => {
    mountNewInternalNetwork().openNewInternalNetworkDrawer()

    expect((await getOverlay().component()).default).toBe(NewInternalNetworkDrawer)
    expect(getOverlay().open.mock.lastCall?.[0].props).toEqual({ poolId: POOL.id })
  })
})

describe('onConfirm', () => {
  it('has no payload before the drawer is confirmed', () => {
    mountNewInternalNetwork()

    expect(getJobPayload().value).toBeUndefined()
  })

  it('closes the drawer when it is cancelled', () => {
    mountNewInternalNetwork()

    expect(getOverlay().events.onCancel).toBe(true)
  })

  it('runs the job in the background with the confirmed payload, and closes the drawer', () => {
    run.mockImplementation(() => {
      expect(getJobPayload().value).toEqual(PAYLOAD)
    })
    mountNewInternalNetwork().openNewInternalNetworkDrawer()

    const response = getOverlay().events.onConfirm(PAYLOAD)

    expect(run).toHaveBeenCalledExactlyOnceWith({ detached: true, onSuccess: expect.any(Function) })
    expect(response).toBeUndefined()
  })

  it('logs the failure when the creation is rejected', () => {
    const consoleError = silenceConsoleError()
    run.mockImplementation(({ onSuccess }: { onSuccess: (results: PromiseSettledResult<unknown>[]) => void }) => {
      onSuccess([{ status: 'rejected', reason: new Error('Creation failed') }])
    })
    mountNewInternalNetwork().openNewInternalNetworkDrawer()

    getOverlay().events.onConfirm(PAYLOAD)

    expect(consoleError).toHaveBeenCalledWith('Failed to create internal network', new Error('Creation failed'))
  })
})
