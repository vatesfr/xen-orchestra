import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useV2vSourceAndDestination } from '@/modules/v2v/composables/use-v2v-source-and-destination.composable.ts'
import { DISKOR_POOL_NAME, UNKNOWN_POOL_ID } from '@/test/create-pool.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { createConnectedV2vContext, v2vConnectionProvide } from '@/test/v2v-connection-provide.ts'
import { V2V_LIST_POOL, V2V_OTHER_POOL } from '@/test/v2v-wizard-fixtures.ts'
import { ref } from 'vue'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

const CONNECTION = createV2vConnection()

function mountSourceAndDestination(
  poolId = ref<FrontXoPool['id'] | undefined>(V2V_LIST_POOL.id),
  { isConnected = true }: { isConnected?: boolean } = {}
) {
  xoCollectionsMock.pools.value = [V2V_LIST_POOL, V2V_OTHER_POOL]

  return mountComposable(() => useV2vSourceAndDestination(poolId), {
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
    expect(mountSourceAndDestination(undefined, { isConnected: false }).sourceHost).toBeUndefined()
  })
})

describe('poolName', () => {
  it('is the name of the pool', () => {
    expect(mountSourceAndDestination().poolName).toBe(DISKOR_POOL_NAME)
  })

  it('follows the pool', () => {
    const poolId = ref<FrontXoPool['id'] | undefined>(V2V_LIST_POOL.id)
    const result = mountSourceAndDestination(poolId)

    poolId.value = V2V_OTHER_POOL.id

    expect(result.poolName).toBe(V2V_OTHER_POOL.name_label)
  })

  it.each([
    ['until a pool is chosen', undefined],
    ['for a pool the pools do not hold', UNKNOWN_POOL_ID],
  ])('is undefined %s', (_, poolId) => {
    expect(mountSourceAndDestination(ref(poolId)).poolName).toBeUndefined()
  })
})
