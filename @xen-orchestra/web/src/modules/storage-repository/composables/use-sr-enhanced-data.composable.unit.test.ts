import type { FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useSrEnhancedData } from '@/modules/storage-repository/composables/use-sr-enhanced-data.composable.ts'
import { createPool } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'
import { mountComposable } from '@/test/mount-composable.ts'

const { getPoolById } = vi.hoisted(() => ({
  getPoolById: vi.fn(),
}))

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({ getPoolById })) as unknown as typeof useXoPoolCollection,
}))

beforeEach(() => {
  getPoolById.mockReset()
})

const POOL_ID = 'pool-1' as FrontXoPool['id']

describe('filterableSrs', () => {
  it('adds the name of the pool of the SR', () => {
    getPoolById.mockImplementation(id => (id === POOL_ID ? createPool({ name_label: 'Main pool' }) : undefined))

    const sr = createSr({ $pool: POOL_ID })

    expect(mountComposable(() => useSrEnhancedData([sr])).wrapper.vm.filterableSrs).toEqual([
      { ...sr, poolName: 'Main pool' },
    ])
  })

  it('has an empty pool name when the pool is unknown', () => {
    getPoolById.mockReturnValue(undefined)

    expect(mountComposable(() => useSrEnhancedData([createSr()])).wrapper.vm.filterableSrs[0].poolName).toBe('')
  })
})
