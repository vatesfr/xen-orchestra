import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useV2vSourceAndDestination } from '@/modules/v2v/composables/use-v2v-source-and-destination.composable.ts'
import { connectV2vSource } from '@/test/connect-v2v-source.ts'
import { createPool, DISKOR_POOL_NAME, UNKNOWN_POOL_ID } from '@/test/create-pool.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import { destinationCollectionsMock } from '@/test/mock-xo-destination-collections.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { ref } from 'vue'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)

const POOL = createPool({ name_label: DISKOR_POOL_NAME })

const OTHER_POOL = createPool({ id: 'pool-other' as FrontXoPool['id'], name_label: 'pool other' })

const CONNECTION = createV2vConnection()

function mountSourceAndDestination(
  poolId = ref<FrontXoPool['id'] | undefined>(POOL.id),
  { isConnected = true }: { isConnected?: boolean } = {}
) {
  destinationCollectionsMock.pools.value = [POOL, OTHER_POOL]

  return mountComposable(() => {
    if (isConnected) {
      connectV2vSource({ connection: CONNECTION })
    }

    return useV2vSourceAndDestination(poolId)
  }).wrapper.vm
}

beforeEach(() => {
  destinationCollectionsMock.reset()
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
    const poolId = ref<FrontXoPool['id'] | undefined>(POOL.id)
    const result = mountSourceAndDestination(poolId)

    poolId.value = OTHER_POOL.id

    expect(result.poolName).toBe(OTHER_POOL.name_label)
  })

  it.each([
    ['until a pool is chosen', undefined],
    ['for a pool the pools do not hold', UNKNOWN_POOL_ID],
  ])('is undefined %s', (_, poolId) => {
    expect(mountSourceAndDestination(ref(poolId)).poolName).toBeUndefined()
  })
})
