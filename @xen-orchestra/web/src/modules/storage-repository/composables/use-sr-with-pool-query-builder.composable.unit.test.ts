import type { FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useSrWithPoolQueryBuilder } from '@/modules/storage-repository/composables/use-sr-with-pool-query-builder.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { createPool } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'
import { mountComposable } from '@/test/mount-composable.ts'

const MAIN_POOL = createPool({ id: 'pool-main' as FrontXoPool['id'], name_label: 'Main pool' })
const TEST_POOL = createPool({ id: 'pool-test' as FrontXoPool['id'], name_label: 'Test pool' })

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({
    getPoolById: (id: FrontXoPool['id']) => [MAIN_POOL, TEST_POOL].find(pool => pool.id === id),
  })) as unknown as typeof useXoPoolCollection,
}))

describe('items', () => {
  it('filters the SRs by the name of their pool', () => {
    const mainSr = createSr({ id: 'sr-main' as FrontXoSr['id'], $pool: MAIN_POOL.id })
    const testSr = createSr({ id: 'sr-test' as FrontXoSr['id'], $pool: TEST_POOL.id })

    const { wrapper } = mountComposable(() =>
      useSrWithPoolQueryBuilder('srs', [mainSr, testSr], { initialFilter: 'poolName:"Test pool"', ignoreRoute: true })
    )

    expect(wrapper.vm.items.map(sr => sr.id)).toEqual([testSr.id])
  })
})
