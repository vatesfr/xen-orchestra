import { useV2vPoolName } from '@/modules/v2v/composables/use-v2v-pool-name.composable.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { seedV2vListPool } from '@/test/seed-v2v-list-pool.ts'
import { v2vConnectionProvide } from '@/test/v2v-connection-provide.ts'
import { V2V_LIST_POOL } from '@/test/v2v-wizard-fixtures.ts'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

function mountPoolName() {
  return mountComposable(() => ({ poolName: useV2vPoolName(V2V_LIST_POOL.id) }), { provide: v2vConnectionProvide() })
    .wrapper.vm
}

beforeEach(() => {
  xoCollectionsMock.reset()
})

it('names the pool', () => {
  seedV2vListPool()

  expect(mountPoolName().poolName).toBe(V2V_LIST_POOL.name_label)
})

it('names the pool by its id while the pools load', () => {
  expect(mountPoolName().poolName).toBe(V2V_LIST_POOL.id)
})
