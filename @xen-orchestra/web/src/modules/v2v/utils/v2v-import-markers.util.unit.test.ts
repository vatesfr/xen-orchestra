import {
  countV2vImportsBySource,
  getV2vImportState,
  getV2vImportVmsBySourceVmId,
} from '@/modules/v2v/utils/v2v-import-markers.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createV2vImportVm, type V2vImportVmMarkers } from '@/test/create-v2v-import-vm.ts'
import { V2V_TEST_SOURCE } from '@/test/create-v2v-inventory.ts'
import { createVm } from '@/test/create-vm.ts'
import { VM_OPERATIONS } from '@vates/types'

const NO_IMPORT = { warm: 0, cold: 0 }

function createImportVms(markersList: V2vImportVmMarkers[]) {
  return markersList.map((markers, index) => createV2vImportVm(markers, { id: `xo-vm-${index}` as FrontXoVm['id'] }))
}

describe('getV2vImportState', () => {
  it('is warm while the start is blocked and a source snapshot is recorded', () => {
    expect(getV2vImportState(createV2vImportVm({ isWarm: true }))).toBe('warm')
  })

  it('is cold once the start is unblocked', () => {
    expect(getV2vImportState(createV2vImportVm({ isWarm: false }))).toBe('cold')
  })

  it('is neither warm nor cold while the start is blocked without a source snapshot (import in progress)', () => {
    expect(getV2vImportState(createV2vImportVm({ isImporting: true }))).toBeUndefined()
  })

  it('is warm whatever the reason of the start lock', () => {
    const vm = createV2vImportVm(
      { isWarm: true },
      { blockedOperations: { [VM_OPERATIONS.START]: 'Locked by admin' } as FrontXoVm['blockedOperations'] }
    )

    expect(getV2vImportState(vm)).toBe('warm')
  })

  it('ignores a VM that is not an import', () => {
    expect(getV2vImportState(createVm())).toBeUndefined()
  })

  it('ignores a copy whose recorded UUID is another VM', () => {
    expect(getV2vImportState(createV2vImportVm({ importedVmUuid: 'original-vm' }))).toBeUndefined()
  })

  it('trusts a legacy import that recorded no UUID', () => {
    expect(getV2vImportState(createV2vImportVm({ importedVmUuid: null }))).toBe('warm')
  })
})

describe('countV2vImportsBySource', () => {
  it('counts the cold and warm imports of the given source', () => {
    const vms = createImportVms([{ isWarm: false }, { isWarm: true }, { isWarm: true }])

    expect(countV2vImportsBySource(vms, V2V_TEST_SOURCE.instanceUuid)).toEqual({ warm: 2, cold: 1 })
  })

  it('ignores the imports of another source, the copies, the legacy imports without source and those in progress', () => {
    const vms = [
      ...createImportVms([
        { sourceId: 'other-vcenter' },
        { importedVmUuid: 'original-vm' },
        { sourceId: null },
        { isImporting: true },
      ]),
      createVm(),
    ]

    expect(countV2vImportsBySource(vms, V2V_TEST_SOURCE.instanceUuid)).toEqual(NO_IMPORT)
  })

  it('counts nothing in an empty list', () => {
    expect(countV2vImportsBySource([], V2V_TEST_SOURCE.instanceUuid)).toEqual(NO_IMPORT)
  })
})

describe('getV2vImportVmsBySourceVmId', () => {
  it('indexes the genuine imports of the source by source VM id', () => {
    const [firstImport, secondImport] = createImportVms([{ sourceVmId: 'vm-1' }, { sourceVmId: 'vm-2', isWarm: false }])

    expect(getV2vImportVmsBySourceVmId([firstImport, secondImport], V2V_TEST_SOURCE.instanceUuid)).toEqual(
      new Map([
        ['vm-1', firstImport],
        ['vm-2', secondImport],
      ])
    )
  })

  it('keeps the first import of a source VM imported twice', () => {
    const [firstImport, secondImport] = createImportVms([{}, {}])

    expect(getV2vImportVmsBySourceVmId([firstImport, secondImport], V2V_TEST_SOURCE.instanceUuid)).toEqual(
      new Map([['vm-1', firstImport]])
    )
  })

  it.each([
    ['an import of another source', createImportVms([{ sourceId: 'other-vcenter' }])],
    ['a copy whose recorded UUID is another VM', createImportVms([{ importedVmUuid: 'original-vm' }])],
    ['a legacy import that recorded no source', createImportVms([{ sourceId: null }])],
    ['a VM that is not an import', [createVm(), ...createImportVms([{ sourceVmId: null }])]],
    ['an empty list', []],
  ])('indexes nothing from %s', (_, vms) => {
    expect(getV2vImportVmsBySourceVmId(vms, V2V_TEST_SOURCE.instanceUuid)).toEqual(new Map())
  })
})
