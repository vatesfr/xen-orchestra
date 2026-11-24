import NewBondedNetworkDrawer from '@/modules/network/components/drawer/NewBondedNetworkDrawer.vue'
import { useNewBondedNetwork } from '@/modules/network/composables/use-new-bonded-network.composable.ts'
import {
  type NewBondedNetworkPayload,
  useXoBondedNetworkCreateJob,
} from '@/modules/network/jobs/xo-bonded-network-create.job.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createPool } from '@/test/create-pool.ts'
import { overlayMock, mockOverlay } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { BOND_MODE, type XoPif } from '@vates/types'
import type { Component, Ref } from 'vue'

type OverlayOptions = {
  component: () => Promise<{ default: Component }>
  events: {
    onConfirm: (payload: NewBondedNetworkPayload) => unknown
    onCancel: true
  }
}

const createJob = createJobStub(useXoBondedNetworkCreateJob)
const { run } = createJob

mockOverlay()

const POOL = createPool()

const PAYLOAD: NewBondedNetworkPayload = {
  poolId: POOL.id,
  name: 'Bonded network',
  pifIds: ['pif-1' as XoPif['id'], 'pif-2' as XoPif['id']],
  bondMode: BOND_MODE.ACTIVE_BACKUP,
}

beforeEach(() => {
  createJob.reset()
  overlayMock.reset()

  silenceConsoleError()
})

function mountNewBondedNetwork() {
  return mountComposable(() => useNewBondedNetwork(POOL)).wrapper.vm
}

function getJobPayload() {
  return (createJob.use.mock.calls[0] as [Ref<NewBondedNetworkPayload | undefined>])[0]
}

function getOverlay() {
  return overlayMock.getOverlay<OverlayOptions>()
}

describe('isCreatingBondedNetwork', () => {
  it('is true while the creation runs', () => {
    createJob.setState({ isRunning: true })

    expect(mountNewBondedNetwork().isCreatingBondedNetwork).toBe(true)
  })
})

describe('openNewBondedNetworkDrawer', () => {
  it('opens the bonded network drawer on the pool', async () => {
    mountNewBondedNetwork().openNewBondedNetworkDrawer()

    expect((await getOverlay().component()).default).toBe(NewBondedNetworkDrawer)
    expect(getOverlay().open.mock.lastCall?.[0].props).toEqual({ poolId: POOL.id })
  })
})

describe('onConfirm', () => {
  it('has no payload before the drawer is confirmed', () => {
    mountNewBondedNetwork()

    expect(getJobPayload().value).toBeUndefined()
  })

  it('closes the drawer when it is cancelled', () => {
    mountNewBondedNetwork()

    expect(getOverlay().events.onCancel).toBe(true)
  })

  it('runs the job in the background with the confirmed payload, and closes the drawer', () => {
    run.mockImplementation(() => {
      expect(getJobPayload().value).toEqual(PAYLOAD)
    })
    mountNewBondedNetwork().openNewBondedNetworkDrawer()

    const response = getOverlay().events.onConfirm(PAYLOAD)

    expect(run).toHaveBeenCalledExactlyOnceWith({ detached: true, onSuccess: expect.any(Function) })
    expect(response).toBeUndefined()
  })

  it('logs the failure when the creation is rejected', () => {
    const consoleError = silenceConsoleError()
    run.mockImplementation(({ onSuccess }: { onSuccess: (results: PromiseSettledResult<unknown>[]) => void }) => {
      onSuccess([{ status: 'rejected', reason: new Error('Creation failed') }])
    })
    mountNewBondedNetwork().openNewBondedNetworkDrawer()

    getOverlay().events.onConfirm(PAYLOAD)

    expect(consoleError).toHaveBeenCalledWith('Failed to create bonded network', new Error('Creation failed'))
  })
})
