import { useV2vPoolName, useV2vPoolNameGetter } from '@/modules/v2v/composables/use-v2v-pool-name.composable.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { seedV2vListPool } from '@/test/seed-v2v-list-pool.ts'
import { V2V_LIST_POOL, V2V_OTHER_POOL } from '@/test/v2v-wizard-fixtures.ts'
import { ref } from 'vue'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

function mountPoolNameGetter() {
  return mountComposable(() => useV2vPoolNameGetter()).wrapper.vm
}

beforeEach(() => {
  xoCollectionsMock.reset()
})

describe('getPoolName', () => {
  it('names the pool', () => {
    seedV2vListPool()

    expect(mountPoolNameGetter().getPoolName(V2V_LIST_POOL.id)).toBe(V2V_LIST_POOL.name_label)
  })

  it('names the pool by its id while the pools load', () => {
    xoCollectionsMock.startLoadingPools()

    expect(mountPoolNameGetter().getPoolName(V2V_LIST_POOL.id)).toBe(V2V_LIST_POOL.id)
  })

  it('names no pool without a pool id', () => {
    seedV2vListPool()

    expect(mountPoolNameGetter().getPoolName(undefined)).toBeUndefined()
  })
})

describe('useV2vPoolName', () => {
  it('follows its pool id', () => {
    seedV2vListPool({ withOtherPool: true })
    const poolId = ref(V2V_LIST_POOL.id)
    const result = mountComposable(() => ({ poolName: useV2vPoolName(poolId) })).wrapper.vm

    poolId.value = V2V_OTHER_POOL.id

    expect(result.poolName).toBe(V2V_OTHER_POOL.name_label)
  })
})
