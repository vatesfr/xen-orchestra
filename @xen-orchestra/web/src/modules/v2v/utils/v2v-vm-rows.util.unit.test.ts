import type { V2vVmStatus } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import {
  buildV2vVmRows,
  buildV2vVmsTableView,
  countV2vRowsByStatus,
  getV2vOtherDatastores,
  getV2vSizeOnDatastore,
  isV2vVmRowSelectable,
  type V2vVmRowsInput,
} from '@/modules/v2v/utils/v2v-vm-rows.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { ONE_GB } from '@/shared/constants.ts'
import { createV2vImportVm, createV2vPartialImportSnapshot } from '@/test/create-v2v-import-vm.ts'
import { createV2vInventory, createV2vVm, createV2vVmWithDisks } from '@/test/create-v2v-inventory.ts'
import { createV2vVmRow, createV2vVmRowsInput } from '@/test/create-v2v-vm-row.ts'
import { V2V_DATASTORE_A, V2V_DATASTORE_B } from '@/test/v2v-vms-fixtures.ts'
import { V2V_VM_POWER_STATE, type XoV2vDatastore, type XoV2vVm } from '@vates/types'

const VM_1 = createV2vVm({ id: 'vm-1' as XoV2vVm['id'] })

const VM_2 = createV2vVm({ id: 'vm-2' as XoV2vVm['id'] })

const TWO_VMS = [VM_1, VM_2]

const OTHER_VM_SNAPSHOT = createV2vPartialImportSnapshot({
  snapshot_time: 200,
  $snapshot_of: 'xo-vm-2' as FrontXoVm['id'],
})

function buildRows(vms: XoV2vVm[], input: Partial<Omit<V2vVmRowsInput, 'inventory'>> = {}) {
  return buildV2vVmRows(
    createV2vVmRowsInput({
      inventory: createV2vInventory({ datastores: [V2V_DATASTORE_A, V2V_DATASTORE_B], vms }),
      ...input,
    })
  )
}

describe('buildV2vVmRows', () => {
  it('builds the row of an inventory VM', () => {
    const vm = createV2vVmWithDisks([{ datastoreId: V2V_DATASTORE_A.id, capacity: 80 * ONE_GB }], {
      id: VM_1.id,
      name: 'app-03',
      powerState: V2V_VM_POWER_STATE.SUSPENDED,
      datastoreIds: [V2V_DATASTORE_A.id],
    })

    expect(buildRows([vm])).toEqual([
      {
        id: VM_1.id,
        name: 'app-03',
        power: V2V_VM_POWER_STATE.SUSPENDED,
        datastore: ['ds-a'],
        size: 80 * ONE_GB,
        migration: 'none',
        supported: true,
        isInList: false,
        vm,
      },
    ])
  })

  it('sizes a VM with the sum of its disk capacities', () => {
    const vm = createV2vVmWithDisks([{ capacity: 10 * ONE_GB }, { capacity: 20 * ONE_GB }])

    expect(buildRows([vm])[0].size).toBe(30 * ONE_GB)
  })

  it('names the datastores in the VM order', () => {
    const vm = createV2vVm({ datastoreIds: [V2V_DATASTORE_B.id, V2V_DATASTORE_A.id] })

    expect(buildRows([vm])[0].datastore).toEqual(['ds-b', 'ds-a'])
  })

  it('skips a datastore missing from the inventory', () => {
    const vm = createV2vVm({ datastoreIds: [V2V_DATASTORE_A.id, 'ds-unknown' as XoV2vDatastore['id']] })

    expect(buildRows([vm])[0].datastore).toEqual(['ds-a'])
  })

  it('gives each VM the status, last sync and VM of its own import', () => {
    const importVm = createV2vImportVm({ isWarm: true, sourceVmId: VM_2.id })

    const rows = buildRows(TWO_VMS, {
      importVmsBySourceVmId: new Map([[VM_2.id, importVm]]),
      snapshots: [createV2vPartialImportSnapshot({ snapshot_time: 100 }), OTHER_VM_SNAPSHOT],
    })

    expect(rows).toMatchObject([
      { id: VM_1.id, migration: 'none', lastSyncAt: undefined, importVm: undefined },
      { id: VM_2.id, migration: 'warm', lastSyncAt: 100_000, importVm },
    ])
  })

  it('has no last sync for an import without snapshot of its own', () => {
    const importVm = createV2vImportVm({ isWarm: false })

    const rows = buildRows([VM_1], {
      importVmsBySourceVmId: new Map([[VM_1.id, importVm]]),
      snapshots: [OTHER_VM_SNAPSHOT],
    })

    expect(rows[0]).toMatchObject({ migration: 'cold', lastSyncAt: undefined, importVm })
  })

  it('marks a VM running while a task imports it', () => {
    const rows = buildRows(TWO_VMS, { runningSourceVmIds: new Set([VM_2.id]) })

    expect(rows.map(row => row.migration)).toEqual(['none', 'running'])
  })

  it('does not support a VM with an unsupported disk', () => {
    const vm = createV2vVmWithDisks([{ isRdm: true }])

    expect(buildRows([vm])[0]).toMatchObject({ supported: false, unsupportedReason: 'rdm' })
  })

  it('marks the VMs of the migration list', () => {
    const rows = buildRows(TWO_VMS, { listVmIds: new Set([VM_2.id]) })

    expect(rows.map(row => row.isInList)).toEqual([false, true])
  })

  it('builds no row from an empty inventory', () => {
    expect(buildRows([])).toEqual([])
  })
})

describe('getV2vSizeOnDatastore', () => {
  it('sums the capacities of the disks on the datastore', () => {
    const vm = createV2vVmWithDisks([
      { datastoreId: V2V_DATASTORE_A.id, capacity: 10 * ONE_GB },
      { datastoreId: V2V_DATASTORE_B.id, capacity: 20 * ONE_GB },
      { datastoreId: V2V_DATASTORE_A.id, capacity: 5 * ONE_GB },
    ])

    expect(getV2vSizeOnDatastore(vm, V2V_DATASTORE_A)).toBe(15 * ONE_GB)
  })

  it('is zero without disk on the datastore', () => {
    const vm = createV2vVmWithDisks([{ datastoreId: V2V_DATASTORE_A.id }])

    expect(getV2vSizeOnDatastore(vm, V2V_DATASTORE_B)).toBe(0)
  })
})

describe('getV2vOtherDatastores', () => {
  it('lists the other datastores of the row', () => {
    expect(getV2vOtherDatastores({ datastore: ['ds-a', 'ds-b', 'ds-c'] }, V2V_DATASTORE_B)).toEqual(['ds-a', 'ds-c'])
  })

  it('lists nothing for a row on that datastore only', () => {
    expect(getV2vOtherDatastores({ datastore: ['ds-a'] }, V2V_DATASTORE_A)).toEqual([])
  })
})

describe('countV2vRowsByStatus', () => {
  it('counts the rows of each status', () => {
    const statuses: V2vVmStatus[] = ['none', 'warm', 'cold', 'warm', 'running']

    expect(countV2vRowsByStatus(statuses.map(migration => ({ migration })))).toEqual({
      none: 1,
      running: 1,
      warm: 2,
      cold: 1,
    })
  })

  it('counts zero of each status without rows', () => {
    expect(countV2vRowsByStatus([])).toEqual({ none: 0, running: 0, warm: 0, cold: 0 })
  })
})

describe('isV2vVmRowSelectable', () => {
  it('selects a supported VM out of the list', () => {
    expect(isV2vVmRowSelectable(createV2vVmRow({ supported: true, isInList: false }))).toBe(true)
  })

  it.each([
    ['an unsupported VM', { supported: false, isInList: false }],
    ['a VM already in the list', { supported: true, isInList: true }],
  ])('does not select %s', (_, row) => {
    expect(isV2vVmRowSelectable(createV2vVmRow(row))).toBe(false)
  })
})

describe('buildV2vVmsTableView', () => {
  const SUPPORTED_ROW = createV2vVmRow({ datastore: ['ds-a', 'ds-b'] })

  const LISTED_ROW = createV2vVmRow({ datastore: ['ds-b'], isInList: true })

  it('tells for each row of all the VMs whether it can be selected and is selected', () => {
    const view = buildV2vVmsTableView([SUPPORTED_ROW, LISTED_ROW], undefined, id => id === SUPPORTED_ROW.id)

    expect(view).toEqual({
      type: 'all',
      rows: [
        { ...SUPPORTED_ROW, isSelectable: true, isSelected: true },
        { ...LISTED_ROW, isSelectable: false, isSelected: false },
      ],
    })
  })

  it('tells for each row of a datastore its other datastores and its size on that datastore', () => {
    const rowOnBoth = createV2vVmRow({
      datastore: ['ds-a', 'ds-b'],
      vm: createV2vVmWithDisks([
        { datastoreId: V2V_DATASTORE_A.id, capacity: 10 * ONE_GB },
        { datastoreId: V2V_DATASTORE_B.id, capacity: 20 * ONE_GB },
      ]),
    })
    const rowWithoutDiskThere = createV2vVmRow({
      datastore: ['ds-b'],
      vm: createV2vVmWithDisks([{ datastoreId: V2V_DATASTORE_A.id }]),
    })

    const view = buildV2vVmsTableView([rowOnBoth, rowWithoutDiskThere], V2V_DATASTORE_B, () => false)

    expect(view).toMatchObject({
      type: 'datastore',
      rows: [
        { id: rowOnBoth.id, isSelectable: true, otherDatastores: ['ds-a'], sizeOnDatastore: 20 * ONE_GB },
        { id: rowWithoutDiskThere.id, isSelectable: true, otherDatastores: [], sizeOnDatastore: 0 },
      ],
    })
  })

  it('has no row without rows', () => {
    expect(buildV2vVmsTableView([], V2V_DATASTORE_B, () => false)).toEqual({ type: 'datastore', rows: [] })
  })
})
