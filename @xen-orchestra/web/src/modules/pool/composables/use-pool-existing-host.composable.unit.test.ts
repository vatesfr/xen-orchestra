import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { usePoolExistingHost } from '@/modules/pool/composables/use-pool-existing-host.composable.ts'
import type { useXoPoolAddHostJob } from '@/modules/pool/jobs/xo-pool-add-host.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { useXoServerForgetJob } from '@/modules/server/jobs/xo-server-forget.job.ts'
import type {
  FrontXoServer,
  useXoServerCollection,
} from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createServer } from '@/test/create-server.ts'
import { groupBy } from '@/test/group-by.ts'
import { overlayMock } from '@/test/mock-overlay.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { flushPromises } from '@vue/test-utils'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

type AddHostResults = PromiseSettledResult<unknown>[]

type ExistingHostDrawerOptions = {
  events: { onConfirm: (hostId: FrontXoHost['id'] | undefined) => unknown }
}

const { servers, forgetServerRun, addHostRun, jobArgs } = vi.hoisted(() => ({
  servers: { value: [] as FrontXoServer[] },
  forgetServerRun: vi.fn(),
  addHostRun: vi.fn(),
  jobArgs: {} as Record<'forget' | 'addHost', unknown>,
}))

vi.mock(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(import('@/modules/server/remote-resources/use-xo-server-collection.ts'), () => ({
  useXoServerCollection: (() => ({
    serverByPool: computed(() => groupBy(servers.value, server => server.poolId)),
  })) as unknown as typeof useXoServerCollection,
}))

vi.mock(import('@/modules/server/jobs/xo-server-forget.job.ts'), () => ({
  useXoServerForgetJob: ((args: MaybeRefOrGetter<unknown>[]) => {
    jobArgs.forget = args
    return { run: forgetServerRun }
  }) as unknown as typeof useXoServerForgetJob,
}))

vi.mock(import('@/modules/pool/jobs/xo-pool-add-host.job.ts'), () => ({
  useXoPoolAddHostJob: ((arg: MaybeRefOrGetter<unknown>) => {
    jobArgs.addHost = arg
    return { run: addHostRun }
  }) as unknown as typeof useXoPoolAddHostJob,
}))

vi.mock(import('@core/packages/overlay/use-overlay.ts'), () => import('@/test/mock-overlay.ts'))

const POOL_ID = 'pool-1' as FrontXoPool['id']

const SOURCE_POOL_ID = 'pool-2' as FrontXoPool['id']

const HOST = createHost({ id: 'host-1' as FrontXoHost['id'], $pool: SOURCE_POOL_ID })

const SOURCE_SERVER = createServer({ id: 'server-2' as FrontXoServer['id'], poolId: SOURCE_POOL_ID })

beforeEach(() => {
  vi.restoreAllMocks()
  overlayMock.reset()
  xoCollectionsMock.reset()
  xoCollectionsMock.hosts.value = [HOST]
  servers.value = [SOURCE_SERVER]
  forgetServerRun.mockReset().mockResolvedValue([{ status: 'fulfilled', value: undefined }])
  addHostRun.mockReset()
})

function mockAddHostResults(results: AddHostResults) {
  addHostRun.mockImplementation(({ onSuccess }: { onSuccess: (results: AddHostResults) => Promise<void> }) =>
    onSuccess(results)
  )
}

function mountExistingHost() {
  const result = mountComposable(() => usePoolExistingHost(POOL_ID)).wrapper.vm
  const drawer = overlayMock.getOverlay<ExistingHostDrawerOptions>()

  return { result, drawer }
}

describe('addExistingHost', () => {
  it('opens the drawer for the pool', () => {
    const { result, drawer } = mountExistingHost()

    result.addExistingHost()

    expect(drawer.open.mock.lastCall?.[0].props.poolId).toBe(POOL_ID)
  })
})

describe('on confirm', () => {
  it('keeps the drawer open without host', () => {
    const { drawer } = mountExistingHost()

    expect(drawer.events.onConfirm(undefined)).toBe(KEEP_OVERLAY_OPEN)
    expect(addHostRun).not.toHaveBeenCalled()
  })

  it('adds the host to the pool in the background', () => {
    const { drawer } = mountExistingHost()

    drawer.events.onConfirm(HOST.id)

    expect(toValue(jobArgs.addHost as MaybeRefOrGetter<unknown>)).toEqual({ poolId: POOL_ID, hostId: HOST.id })
    expect(addHostRun).toHaveBeenCalledWith({ detached: true, onSuccess: expect.any(Function) })
  })

  it('forgets the server of the former pool of the host once added', async () => {
    mockAddHostResults([{ status: 'fulfilled', value: undefined }])
    const { drawer } = mountExistingHost()

    drawer.events.onConfirm(HOST.id)
    await flushPromises()

    expect(toValue((jobArgs.forget as MaybeRefOrGetter<unknown>[])[0])).toBe(SOURCE_SERVER.id)
    expect(forgetServerRun).toHaveBeenCalledOnce()
  })

  it('keeps the server of the former pool when adding the host failed', async () => {
    silenceConsoleError()
    mockAddHostResults([{ status: 'rejected', reason: new Error('Host is not compatible') }])
    const { drawer } = mountExistingHost()

    drawer.events.onConfirm(HOST.id)
    await flushPromises()

    expect(forgetServerRun).not.toHaveBeenCalled()
  })
})
