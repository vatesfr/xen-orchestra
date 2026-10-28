import type { V2vVmRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { buildV2vVmRows, type V2vVmRowsInput } from '@/modules/v2v/utils/v2v-vm-rows.util.ts'
import { createV2vInventory, createV2vVm } from '@/test/create-v2v-inventory.ts'
import type { XoV2vVm } from '@vates/types'

let createdRowCount = 0

export function createV2vVmRowsInput(overrides: Partial<V2vVmRowsInput> = {}): V2vVmRowsInput {
  return {
    inventory: createV2vInventory(),
    importVmsBySourceVmId: new Map(),
    runningSourceVmIds: new Set(),
    snapshots: [],
    listVmIds: new Set(),
    ...overrides,
  }
}

// Built by buildV2vVmRows from an inventory VM of its own, so its fields stay those production derives and the rows
// of a test never share an id
export function createV2vVmRow(overrides: Partial<V2vVmRow> = {}): V2vVmRow {
  createdRowCount++
  const vm = createV2vVm({ id: `vm-row-${createdRowCount}` as XoV2vVm['id'] })
  const [row] = buildV2vVmRows(createV2vVmRowsInput({ inventory: createV2vInventory({ vms: [vm] }) }))

  return { ...row, ...overrides }
}

export function getV2vVmNames(vms: Pick<V2vVmRow, 'name'>[]): string[] {
  return vms.map(vm => vm.name)
}

export function getV2vVmIds(vms: Pick<V2vVmRow, 'id'>[]): V2vVmRow['id'][] {
  return vms.map(vm => vm.id)
}
