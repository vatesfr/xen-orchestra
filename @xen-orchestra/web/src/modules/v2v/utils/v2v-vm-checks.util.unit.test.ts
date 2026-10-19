import type { V2vUnsupportedReason } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { getV2vUnsupportedReason } from '@/modules/v2v/utils/v2v-vm-checks.util.ts'
import { createV2vVmWithDisks } from '@/test/create-v2v-inventory.ts'
import { V2V_DISK_MODE, type XoV2vDisk } from '@vates/types'

describe('getV2vUnsupportedReason', () => {
  it.each<[string, Partial<XoV2vDisk>, V2vUnsupportedReason]>([
    ['an RDM disk', { isRdm: true }, 'rdm'],
    ['an independent persistent disk', { mode: V2V_DISK_MODE.INDEPENDENT_PERSISTENT }, 'independent'],
    ['an independent non-persistent disk', { mode: V2V_DISK_MODE.INDEPENDENT_NON_PERSISTENT }, 'independent'],
    ['an encrypted disk', { isEncrypted: true }, 'encrypted'],
  ])('rejects a VM with %s among its disks', (_, disk, reason) => {
    expect(getV2vUnsupportedReason(createV2vVmWithDisks([{}, disk]))).toBe(reason)
  })

  it('reports an RDM disk before an independent or encrypted one, whatever the disk order', () => {
    const vm = createV2vVmWithDisks([
      { isEncrypted: true },
      { mode: V2V_DISK_MODE.INDEPENDENT_PERSISTENT },
      { isRdm: true },
    ])

    expect(getV2vUnsupportedReason(vm)).toBe('rdm')
  })

  it('reports an independent disk before an encrypted one, whatever the disk order', () => {
    const vm = createV2vVmWithDisks([{ isEncrypted: true }, { mode: V2V_DISK_MODE.INDEPENDENT_NON_PERSISTENT }])

    expect(getV2vUnsupportedReason(vm)).toBe('independent')
  })

  it.each([
    ['whose disks are all supported', [{}, { mode: V2V_DISK_MODE.NON_PERSISTENT }]],
    ['without disks', []],
  ])('accepts a VM %s', (_, disks) => {
    expect(getV2vUnsupportedReason(createV2vVmWithDisks(disks))).toBeUndefined()
  })
})
