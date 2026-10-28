import { useV2vPoolName } from '@/modules/v2v/composables/use-v2v-pool-name.composable.ts'
import { createPool } from '@/test/create-pool.ts'
import { destinationCollectionsMock } from '@/test/mock-xo-destination-collections.ts'
import { mountComposable } from '@/test/mount-composable.ts'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)

const POOL = createPool()

function mountPoolName() {
  return mountComposable(() => ({ poolName: useV2vPoolName(POOL.id) })).wrapper.vm
}

beforeEach(() => {
  destinationCollectionsMock.reset()
})

it('names the pool', () => {
  destinationCollectionsMock.pools.value = [POOL]

  expect(mountPoolName().poolName).toBe(POOL.name_label)
})

it('names the pool by its id while the pools load', () => {
  expect(mountPoolName().poolName).toBe(POOL.id)
})
