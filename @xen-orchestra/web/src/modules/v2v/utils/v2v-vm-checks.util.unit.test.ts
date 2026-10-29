import type { V2vUnsupportedReason } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { getV2vUnsupportedReason, getV2vVmChecks } from '@/modules/v2v/utils/v2v-vm-checks.util.ts'
import { createV2vVm, createV2vVmWithDisks } from '@/test/create-v2v-inventory.ts'
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

describe('getV2vVmChecks', () => {
  it('tells a VM without unsupported disk nor snapshot ready', () => {
    expect(getV2vVmChecks(createV2vVm({ snapshotCount: 0 }))).toEqual([
      { type: 'no-unsupported-disk', level: 'ready' },
      { type: 'no-snapshot', level: 'ready' },
    ])
  })

  // Each reason and their precedence are those of `getV2vUnsupportedReason`, tested above
  it('blocks a VM with an unsupported disk, with its reason', () => {
    expect(getV2vVmChecks(createV2vVmWithDisks([{}, { isEncrypted: true }]))[0]).toEqual({
      type: 'unsupported',
      level: 'blocking',
      reason: 'encrypted',
    })
  })

  it('warns about the snapshots of the source VM, with their count', () => {
    expect(getV2vVmChecks(createV2vVm({ snapshotCount: 3 }))[1]).toEqual({
      type: 'snapshots',
      level: 'warning',
      count: 3,
    })
  })
})
