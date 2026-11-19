import { useV2vSourceAndDestination } from '@/modules/v2v/composables/use-v2v-source-and-destination.composable.ts'
import { DISKOR_POOL_NAME } from '@/test/create-pool.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { seedV2vListPool } from '@/test/seed-v2v-list-pool.ts'
import { createConnectedV2vContext, v2vConnectionProvide } from '@/test/v2v-connection-provide.ts'
import { V2V_LIST_POOL } from '@/test/v2v-wizard-fixtures.ts'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

const CONNECTION = createV2vConnection()

function mountSourceAndDestination({ isConnected = true }: { isConnected?: boolean } = {}) {
  seedV2vListPool()

  return mountComposable(() => useV2vSourceAndDestination(V2V_LIST_POOL.id), {
    provide: v2vConnectionProvide(isConnected ? createConnectedV2vContext({ connection: CONNECTION }) : undefined),
  }).wrapper.vm
}

beforeEach(() => {
  xoCollectionsMock.reset()
})

describe('sourceHost', () => {
  it('is the host of the connected source', () => {
    expect(mountSourceAndDestination().sourceHost).toBe(CONNECTION.host)
  })

  it('is undefined until a source is connected', () => {
    expect(mountSourceAndDestination({ isConnected: false }).sourceHost).toBeUndefined()
  })
})

describe('poolName', () => {
  it('is the name of the pool', () => {
    expect(mountSourceAndDestination().poolName).toBe(DISKOR_POOL_NAME)
  })
})
