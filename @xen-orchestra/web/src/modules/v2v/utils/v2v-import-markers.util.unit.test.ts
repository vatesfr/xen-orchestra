import { countV2vImportsBySource, getV2vImportState } from '@/modules/v2v/utils/v2v-import-markers.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createV2vImportVm, type V2vImportVmMarkers } from '@/test/create-v2v-import-vm.ts'
import { V2V_TEST_SOURCE } from '@/test/create-v2v-inventory.ts'
import { createVm } from '@/test/create-vm.ts'
import { VM_OPERATIONS } from '@vates/types'

const NO_IMPORT = { warm: 0, cold: 0 }

function blockStart(reason: string) {
  return { [VM_OPERATIONS.START]: reason } as FrontXoVm['blockedOperations']
}

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
    const vm = createV2vImportVm({ isWarm: false }, { blockedOperations: blockStart('Locked') })

    expect(getV2vImportState(vm)).toBeUndefined()
  })

  it('is warm whatever the reason of the start lock', () => {
    const vm = createV2vImportVm({ isWarm: true }, { blockedOperations: blockStart('Locked by admin') })

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
      ...createImportVms([{ sourceId: 'other-vcenter' }, { importedVmUuid: 'original-vm' }, { sourceId: null }]),
      createV2vImportVm(
        { isWarm: false },
        { id: 'xo-vm-in-progress' as FrontXoVm['id'], blockedOperations: blockStart('Locked') }
      ),
      createVm(),
    ]

    expect(countV2vImportsBySource(vms, V2V_TEST_SOURCE.instanceUuid)).toEqual(NO_IMPORT)
  })

  it('counts nothing in an empty list', () => {
    expect(countV2vImportsBySource([], V2V_TEST_SOURCE.instanceUuid)).toEqual(NO_IMPORT)
  })
})
