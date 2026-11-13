import { usePoolQueryBuilder } from '@/modules/pool/composables/use-pool-query-builder.composable.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { createPool } from '@/test/create-pool.ts'
import { mountComposable } from '@/test/mount-composable.ts'

describe('items', () => {
  it('keeps only the pools matching the initial filter', () => {
    const mainPool = createPool({ id: 'pool-main' as FrontXoPool['id'], tags: ['prod'] })
    const testPool = createPool({ id: 'pool-test' as FrontXoPool['id'], tags: ['dev'] })

    const { wrapper } = mountComposable(() =>
      usePoolQueryBuilder('pools', [mainPool, testPool], { initialFilter: 'tags:prod', ignoreRoute: true })
    )

    expect(wrapper.vm.items).toEqual([mainPool])
  })
})
