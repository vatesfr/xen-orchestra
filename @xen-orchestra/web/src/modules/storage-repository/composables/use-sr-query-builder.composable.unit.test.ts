import { useSrQueryBuilder } from '@/modules/storage-repository/composables/use-sr-query-builder.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { createSr } from '@/test/create-sr.ts'
import { mountComposable } from '@/test/mount-composable.ts'

describe('items', () => {
  it('keeps only the SRs matching the initial filter', () => {
    const lvmSr = createSr({ id: 'sr-1' as FrontXoSr['id'], SR_type: 'lvm' })
    const nfsSr = createSr({ id: 'sr-2' as FrontXoSr['id'], SR_type: 'nfs' })

    const { wrapper } = mountComposable(() => useSrQueryBuilder('sr', [lvmSr, nfsSr], { initialFilter: 'SR_type:nfs' }))

    expect(wrapper.vm.items).toEqual([nfsSr])
  })
})
