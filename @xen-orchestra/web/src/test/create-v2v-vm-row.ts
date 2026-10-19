import type { V2vVmRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { buildV2vVmRows } from '@/modules/v2v/utils/v2v-vm-rows.util.ts'
import { createV2vInventory } from '@/test/create-v2v-inventory.ts'

// Built by buildV2vVmRows from the default inventory VM, so its fields stay those production derives
export function createV2vVmRow(overrides: Partial<V2vVmRow> = {}): V2vVmRow {
  const [row] = buildV2vVmRows({
    inventory: createV2vInventory(),
    importVmsBySourceVmId: new Map(),
    runningSourceVmIds: new Set(),
    snapshots: [],
    listVmIds: new Set(),
  })

  return { ...row, ...overrides }
}
