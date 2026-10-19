import type { V2vVmStatus } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import {
  buildV2vVmRows,
  countV2vRowsByStatus,
  getV2vOtherDatastores,
  getV2vSizeOnDatastore,
  type V2vVmRowsInput,
} from '@/modules/v2v/utils/v2v-vm-rows.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { ONE_GB } from '@/shared/constants.ts'
import { createV2vImportVm, createV2vPartialImportSnapshot } from '@/test/create-v2v-import-vm.ts'
import {
  createV2vDatastore,
  createV2vInventory,
  createV2vVm,
  createV2vVmWithDisks,
} from '@/test/create-v2v-inventory.ts'
import { V2V_VM_POWER_STATE, type XoV2vDatastore, type XoV2vVm } from '@vates/types'

const DATASTORE_A = createV2vDatastore({ id: 'datastore-a' as XoV2vDatastore['id'], name: 'ds-a' })

const DATASTORE_B = createV2vDatastore({ id: 'datastore-b' as XoV2vDatastore['id'], name: 'ds-b' })

const VM_1 = createV2vVm({ id: 'vm-1' as XoV2vVm['id'] })

const VM_2 = createV2vVm({ id: 'vm-2' as XoV2vVm['id'] })

const TWO_VMS = [VM_1, VM_2]

const OTHER_VM_SNAPSHOT = createV2vPartialImportSnapshot({
  snapshot_time: 200,
  $snapshot_of: 'xo-vm-2' as FrontXoVm['id'],
})

function buildRows(vms: XoV2vVm[], input: Partial<Omit<V2vVmRowsInput, 'inventory'>> = {}) {
  return buildV2vVmRows({
    inventory: createV2vInventory({ datastores: [DATASTORE_A, DATASTORE_B], vms }),
    importVmsBySourceVmId: new Map(),
    runningSourceVmIds: new Set(),
    snapshots: [],
    listVmIds: new Set(),
    ...input,
  })
}

describe('buildV2vVmRows', () => {
  it('builds the row of an inventory VM', () => {
    const vm = createV2vVmWithDisks([{ datastoreId: DATASTORE_A.id, capacity: 80 * ONE_GB }], {
      id: VM_1.id,
      name: 'app-03',
      powerState: V2V_VM_POWER_STATE.SUSPENDED,
      datastoreIds: [DATASTORE_A.id],
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
    const vm = createV2vVm({ datastoreIds: [DATASTORE_B.id, DATASTORE_A.id] })

    expect(buildRows([vm])[0].datastore).toEqual(['ds-b', 'ds-a'])
  })

  it('skips a datastore missing from the inventory', () => {
    const vm = createV2vVm({ datastoreIds: [DATASTORE_A.id, 'ds-unknown' as XoV2vDatastore['id']] })

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
      { datastoreId: DATASTORE_A.id, capacity: 10 * ONE_GB },
      { datastoreId: DATASTORE_B.id, capacity: 20 * ONE_GB },
      { datastoreId: DATASTORE_A.id, capacity: 5 * ONE_GB },
    ])

    expect(getV2vSizeOnDatastore(vm, DATASTORE_A)).toBe(15 * ONE_GB)
  })

  it('is zero without disk on the datastore', () => {
    const vm = createV2vVmWithDisks([{ datastoreId: DATASTORE_A.id }])

    expect(getV2vSizeOnDatastore(vm, DATASTORE_B)).toBe(0)
  })
})

describe('getV2vOtherDatastores', () => {
  it('lists the other datastores of the row', () => {
    expect(getV2vOtherDatastores({ datastore: ['ds-a', 'ds-b', 'ds-c'] }, DATASTORE_B)).toEqual(['ds-a', 'ds-c'])
  })

  it('lists nothing for a row on that datastore only', () => {
    expect(getV2vOtherDatastores({ datastore: ['ds-a'] }, DATASTORE_A)).toEqual([])
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
