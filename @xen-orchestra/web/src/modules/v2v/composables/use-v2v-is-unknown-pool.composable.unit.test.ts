import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useV2vIsUnknownPool } from '@/modules/v2v/composables/use-v2v-is-unknown-pool.composable.ts'
import { createPool, UNKNOWN_POOL_ID } from '@/test/create-pool.ts'
import { destinationCollectionsMock } from '@/test/mock-xo-destination-collections.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { ref } from 'vue'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)

const POOL = createPool()

function mountIsUnknownPool(poolId = ref<FrontXoPool['id'] | undefined>(UNKNOWN_POOL_ID)) {
  destinationCollectionsMock.pools.value = [POOL]

  return mountComposable(() => ({ isUnknownPool: useV2vIsUnknownPool(poolId) })).wrapper.vm
}

beforeEach(() => {
  destinationCollectionsMock.reset()
})

it('tells a pool this XO does not know', () => {
  expect(mountIsUnknownPool().isUnknownPool).toBe(true)
})

it('knows a pool of this XO', () => {
  expect(mountIsUnknownPool(ref(POOL.id)).isUnknownPool).toBe(false)
})

it('trusts the pool while the pools load', () => {
  destinationCollectionsMock.arePoolsReady.value = false

  expect(mountIsUnknownPool().isUnknownPool).toBe(false)
})

it('has no unknown pool before one is chosen', () => {
  expect(mountIsUnknownPool(ref(undefined)).isUnknownPool).toBe(false)
})

it('follows the pool', () => {
  const poolId = ref<FrontXoPool['id'] | undefined>(POOL.id)
  const result = mountIsUnknownPool(poolId)

  poolId.value = UNKNOWN_POOL_ID

  expect(result.isUnknownPool).toBe(true)
})

it('tells the pool unknown once the pools are loaded', () => {
  destinationCollectionsMock.arePoolsReady.value = false
  const result = mountIsUnknownPool()

  destinationCollectionsMock.arePoolsReady.value = true

  expect(result.isUnknownPool).toBe(true)
})
