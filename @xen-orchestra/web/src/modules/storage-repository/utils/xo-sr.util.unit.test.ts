import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import {
  compareSrAccessModes,
  compareSrFormats,
  compareSrUsages,
} from '@/modules/storage-repository/utils/xo-sr.util.ts'
import { createSr } from '@/test/create-sr.ts'

function sortSrLabels(srs: FrontXoSr[], compareFn: (sr1: FrontXoSr, sr2: FrontXoSr) => number) {
  return [...srs].sort(compareFn).map(sr => sr.name_label)
}

describe('compareSrFormats', () => {
  it('orders storage repositories alphabetically by storage format', () => {
    const srs = [
      createSr({ name_label: 'NFS SR', SR_type: 'nfs' }),
      createSr({ name_label: 'EXT SR', SR_type: 'ext' }),
      createSr({ name_label: 'LVM SR', SR_type: 'lvm' }),
    ]

    expect(sortSrLabels(srs, compareSrFormats)).toEqual(['EXT SR', 'LVM SR', 'NFS SR'])
  })
})

describe('compareSrAccessModes', () => {
  it('orders local storage repositories before shared ones', () => {
    const srs = [
      createSr({ name_label: 'Shared SR', shared: true }),
      createSr({ name_label: 'Local SR', shared: false }),
    ]

    expect(sortSrLabels(srs, compareSrAccessModes)).toEqual(['Local SR', 'Shared SR'])
  })
})

describe('compareSrUsages', () => {
  it('orders storage repositories by used space percentage rather than absolute usage', () => {
    const srs = [
      createSr({ name_label: 'Small SR', physical_usage: 9, size: 10 }),
      createSr({ name_label: 'Big SR', physical_usage: 500, size: 1000 }),
    ]

    expect(sortSrLabels(srs, compareSrUsages)).toEqual(['Big SR', 'Small SR'])
  })

  it('treats a storage repository with no size as 0% used', () => {
    const srs = [
      createSr({ name_label: 'Used SR', physical_usage: 10, size: 100 }),
      createSr({ name_label: 'Empty SR', physical_usage: 0, size: 0 }),
    ]

    expect(sortSrLabels(srs, compareSrUsages)).toEqual(['Empty SR', 'Used SR'])
  })
})
