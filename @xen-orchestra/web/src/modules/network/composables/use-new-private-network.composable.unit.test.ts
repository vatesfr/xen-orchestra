import { useNewPrivateNetwork } from '@/modules/network/composables/use-new-private-network.composable.ts'
import type {
  NewPrivateNetworkPayload,
  useXoPrivateNetworkCreateJob,
} from '@/modules/network/jobs/xo-private-network-create.job.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type {
  FrontXoPlugin,
  useXoPluginCollection,
} from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { createPool } from '@/test/create-pool.ts'
import { overlayMock } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { TUNNEL_PROTOCOL } from '@vates/types'
import { computed, type MaybeRefOrGetter, type Ref, ref, toValue } from 'vue'

type OverlayOptions = {
  events: {
    onConfirm: (payload: NewPrivateNetworkPayload) => unknown
    onCancel: true
  }
}

const { useCreateJob, run, pluginsMock } = vi.hoisted(() => ({
  useCreateJob: vi.fn(),
  run: vi.fn(),
  pluginsMock: { plugins: [] as FrontXoPlugin[], arePluginsReady: true },
}))

vi.mock(import('@/modules/network/jobs/xo-private-network-create.job.ts'), () => ({
  useXoPrivateNetworkCreateJob: useCreateJob as unknown as typeof useXoPrivateNetworkCreateJob,
}))

vi.mock(import('@core/packages/overlay/use-overlay.ts'), () => import('@/test/mock-overlay.ts'))

// The plugin collection would open an SSE subscription
vi.mock(import('@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'), () => ({
  useXoPluginCollection: (() => ({
    arePluginsReady: computed(() => pluginsMock.arePluginsReady),
    useGetPluginById: (id: MaybeRefOrGetter<FrontXoPlugin['id']>) =>
      computed(() => pluginsMock.plugins.find(plugin => plugin.id === toValue(id))),
  })) as unknown as typeof useXoPluginCollection,
}))

const POOL = createPool()

const PAYLOAD: NewPrivateNetworkPayload = {
  poolIds: [POOL.id],
  pifIds: ['pif-1' as FrontXoPif['id']],
  name: 'Private network',
  description: '',
  encapsulation: TUNNEL_PROTOCOL.GRE,
  encrypted: false,
}

function createSdnControllerPlugin(loaded: boolean) {
  return createPlugin({ id: 'sdn-controller' as FrontXoPlugin['id'], name: 'sdn-controller', loaded })
}

beforeEach(() => {
  useCreateJob.mockReset()
  run.mockReset()
  overlayMock.reset()
  pluginsMock.plugins = [createSdnControllerPlugin(true)]
  pluginsMock.arePluginsReady = true

  silenceConsoleError()

  useCreateJob.mockReturnValue({ run, isRunning: ref(false) })
})

function mountNewPrivateNetwork() {
  return mountComposable(() => useNewPrivateNetwork(POOL)).wrapper.vm
}

function getJobPayload() {
  return (useCreateJob.mock.calls[0] as [Ref<NewPrivateNetworkPayload | undefined>])[0]
}

function getOverlay() {
  return overlayMock.getOverlay<OverlayOptions>()
}

// The drawer receives its props as a reactive object, read when it was last opened
function getDrawerProps() {
  return getOverlay().open.mock.lastCall?.[0].props
}

describe('canCreatePrivateNetwork', () => {
  it('is true once the SDN controller plugin is loaded', () => {
    expect(mountNewPrivateNetwork().canCreatePrivateNetwork).toBe(true)
  })

  it('is false while the SDN controller plugin is not loaded', () => {
    pluginsMock.plugins = [createSdnControllerPlugin(false)]

    expect(mountNewPrivateNetwork().canCreatePrivateNetwork).toBe(false)
  })

  it('is false without the SDN controller plugin', () => {
    pluginsMock.plugins = []

    expect(mountNewPrivateNetwork().canCreatePrivateNetwork).toBe(false)
  })
})

describe('isSdnControllerMissing', () => {
  it('is true once the plugins are loaded without the SDN controller loaded', () => {
    pluginsMock.plugins = [createSdnControllerPlugin(false)]

    expect(mountNewPrivateNetwork().isSdnControllerMissing).toBe(true)
  })

  it('is false while the plugins are loading', () => {
    pluginsMock.plugins = []
    pluginsMock.arePluginsReady = false

    expect(mountNewPrivateNetwork().isSdnControllerMissing).toBe(false)
  })

  it('is false when the SDN controller is loaded', () => {
    expect(mountNewPrivateNetwork().isSdnControllerMissing).toBe(false)
  })
})

describe('openNewPrivateNetworkDrawer', () => {
  it('opens the drawer on the pool', () => {
    mountNewPrivateNetwork().openNewPrivateNetworkDrawer()

    expect(getDrawerProps()).toEqual({ poolId: POOL.id })
  })
})

describe('onConfirm', () => {
  it('has no payload before the drawer is confirmed', () => {
    mountNewPrivateNetwork()

    expect(getJobPayload().value).toBeUndefined()
  })

  it('closes the drawer when it is cancelled', () => {
    mountNewPrivateNetwork()

    expect(getOverlay().events.onCancel).toBe(true)
  })

  it('runs the job in the background with the confirmed payload, and closes the drawer', () => {
    run.mockImplementation(() => {
      expect(getJobPayload().value).toEqual(PAYLOAD)
    })
    mountNewPrivateNetwork().openNewPrivateNetworkDrawer()

    const response = getOverlay().events.onConfirm(PAYLOAD)

    expect(run).toHaveBeenCalledExactlyOnceWith({ detached: true, onSuccess: expect.any(Function) })
    expect(response).toBeUndefined()
  })

  it('logs the failure when the creation is rejected', () => {
    const consoleError = silenceConsoleError()
    run.mockImplementation(({ onSuccess }: { onSuccess: (results: PromiseSettledResult<unknown>[]) => void }) => {
      onSuccess([{ status: 'rejected', reason: new Error('Creation failed') }])
    })
    mountNewPrivateNetwork().openNewPrivateNetworkDrawer()

    getOverlay().events.onConfirm(PAYLOAD)

    expect(consoleError).toHaveBeenCalledWith('Failed to create private network', new Error('Creation failed'))
  })
})
