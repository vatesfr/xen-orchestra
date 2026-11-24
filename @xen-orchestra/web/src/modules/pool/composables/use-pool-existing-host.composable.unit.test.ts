import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { usePoolExistingHost } from '@/modules/pool/composables/use-pool-existing-host.composable.ts'
import { useXoPoolAddHostJob } from '@/modules/pool/jobs/xo-pool-add-host.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoServerForgetJob } from '@/modules/server/jobs/xo-server-forget.job.ts'
import type {
  FrontXoServer,
  useXoServerCollection,
} from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createPool } from '@/test/create-pool.ts'
import { createServer } from '@/test/create-server.ts'
import { groupBy } from '@/test/group-by.ts'
import { mockOverlay, overlayMock } from '@/test/mock-overlay.ts'
import { mockXoCollections, xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { flushPromises } from '@vue/test-utils'
import { computed, type MaybeRefOrGetter, ref, toValue } from 'vue'

type ExistingHostDrawerOptions = {
  events: { onConfirm: (hostId: FrontXoHost['id'] | undefined) => unknown }
}

const servers = ref<FrontXoServer[]>([])

const forgetJob = createJobStub(useXoServerForgetJob)
const addHostJob = createJobStub(useXoPoolAddHostJob)

mockXoCollections('host', 'pool')

mockModule(import('@/modules/server/remote-resources/use-xo-server-collection.ts'), () => ({
  useXoServerCollection: (() => ({
    serverByPool: computed(() => groupBy(servers.value, server => server.poolId)),
  })) as unknown as typeof useXoServerCollection,
}))

mockOverlay()

const POOL = createPool({ id: 'pool-1' as FrontXoPool['id'] })

const SOURCE_POOL_ID = 'pool-2' as FrontXoPool['id']

const HOST = createHost({ id: 'host-1' as FrontXoHost['id'], $pool: SOURCE_POOL_ID })

const SOURCE_SERVER = createServer({ id: 'server-2' as FrontXoServer['id'], poolId: SOURCE_POOL_ID })

beforeEach(() => {
  vi.restoreAllMocks()
  overlayMock.reset()
  xoCollectionsMock.reset()
  xoCollectionsMock.hosts.value = [HOST]
  xoCollectionsMock.pools.value = [POOL]
  servers.value = [SOURCE_SERVER]
  forgetJob.reset()
  addHostJob.reset()
  forgetJob.run.mockResolvedValue([{ status: 'fulfilled', value: undefined }])
})

function mockAddHostSuccess() {
  addHostJob.run.mockImplementation(({ onSuccess }: { onSuccess: () => Promise<void> }) => onSuccess())
}

function mountExistingHost() {
  const result = mountComposable(() => usePoolExistingHost(POOL.id)).wrapper.vm
  const drawer = overlayMock.getOverlay<ExistingHostDrawerOptions>()

  return { result, drawer }
}

describe('addExistingHost', () => {
  it('opens the drawer for the pool', () => {
    const { result, drawer } = mountExistingHost()

    result.addExistingHost()

    expect(drawer.open.mock.lastCall?.[0].props.poolId).toBe(POOL.id)
  })
})

describe('on confirm', () => {
  it('keeps the drawer open without host', () => {
    const { drawer } = mountExistingHost()

    expect(drawer.events.onConfirm(undefined)).toBe(KEEP_OVERLAY_OPEN)
    expect(addHostJob.run).not.toHaveBeenCalled()
  })

  it('adds the host to the pool in the background', () => {
    const { drawer } = mountExistingHost()

    drawer.events.onConfirm(HOST.id)

    expect((addHostJob.use.mock.lastCall as MaybeRefOrGetter<unknown>[]).map(arg => toValue(arg))).toEqual([POOL, { hostId: HOST.id }])
    expect(addHostJob.run).toHaveBeenCalledWith({ detached: true, onSuccess: expect.any(Function) })
  })

  it('forgets the server of the former pool of the host once added', async () => {
    mockAddHostSuccess()
    const { drawer } = mountExistingHost()

    drawer.events.onConfirm(HOST.id)
    await flushPromises()

    expect(toValue((forgetJob.use.mock.lastCall?.[0] as MaybeRefOrGetter<unknown>[])[0])).toBe(SOURCE_SERVER.id)
    expect(forgetJob.run).toHaveBeenCalledOnce()
  })

  it('keeps the server of the former pool when adding the host failed', async () => {
    const { drawer } = mountExistingHost()

    drawer.events.onConfirm(HOST.id)
    await flushPromises()

    expect(forgetJob.run).not.toHaveBeenCalled()
  })
})
