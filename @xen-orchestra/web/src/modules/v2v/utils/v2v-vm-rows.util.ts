import type { V2vVmRow, V2vVmStatus } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { getV2vUnsupportedReason } from '@/modules/v2v/utils/v2v-vm-checks.util.ts'
import { getV2vLastSyncAt, getV2vVmStatus, type V2vImportSnapshot } from '@/modules/v2v/utils/v2v-vm-status.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { safePushInMap } from '@/shared/utils/map.util.ts'
import type { XoV2vDatastore, XoV2vDisk, XoV2vInventory, XoV2vVm } from '@vates/types'

export type V2vVmRowsInput = {
  inventory: Pick<XoV2vInventory, 'vms' | 'datastores'>
  importVmsBySourceVmId: Map<XoV2vVm['id'], FrontXoVm>
  runningSourceVmIds: Set<XoV2vVm['id']>
  snapshots: V2vImportSnapshot[]
  listVmIds: Set<XoV2vVm['id']>
}

function sumDiskCapacities(disks: XoV2vDisk[]) {
  return disks.reduce((size, disk) => size + disk.capacity, 0)
}

// An inventory can hold thousands of VMs: datastores and snapshots are indexed once, not searched per VM
export function buildV2vVmRows({
  inventory,
  importVmsBySourceVmId,
  runningSourceVmIds,
  snapshots,
  listVmIds,
}: V2vVmRowsInput): V2vVmRow[] {
  const datastoreNames = new Map(inventory.datastores.map(datastore => [datastore.id, datastore.name]))
  const snapshotsByVmId = new Map<V2vImportSnapshot['$snapshot_of'], V2vImportSnapshot[]>()

  for (const snapshot of snapshots) {
    safePushInMap(snapshotsByVmId, snapshot.$snapshot_of, snapshot)
  }

  return inventory.vms.map(vm => {
    const importVm = importVmsBySourceVmId.get(vm.id)
    const unsupportedReason = getV2vUnsupportedReason(vm)
    const importSnapshots = importVm === undefined ? [] : (snapshotsByVmId.get(importVm.id) ?? [])

    return {
      id: vm.id,
      name: vm.name,
      power: vm.powerState,
      datastore: vm.datastoreIds.flatMap(datastoreId => datastoreNames.get(datastoreId) ?? []),
      size: sumDiskCapacities(vm.disks),
      migration: getV2vVmStatus(importVm, runningSourceVmIds.has(vm.id)),
      supported: unsupportedReason === undefined,
      unsupportedReason,
      lastSyncAt: getV2vLastSyncAt(importSnapshots),
      isInList: listVmIds.has(vm.id),
      importVm,
      vm,
    }
  })
}

type V2vDatastoreRef = Pick<XoV2vDatastore, 'id' | 'name'>

export function getV2vSizeOnDatastore(vm: Pick<XoV2vVm, 'disks'>, datastore: V2vDatastoreRef): number {
  return sumDiskCapacities(vm.disks.filter(disk => disk.datastoreId === datastore.id))
}

// The row holds datastore names, not ids
export function getV2vOtherDatastores(row: Pick<V2vVmRow, 'datastore'>, datastore: V2vDatastoreRef): string[] {
  return row.datastore.filter(name => name !== datastore.name)
}

export function countV2vRowsByStatus(rows: Pick<V2vVmRow, 'migration'>[]): Record<V2vVmStatus, number> {
  const counts: Record<V2vVmStatus, number> = { none: 0, running: 0, warm: 0, cold: 0 }

  for (const row of rows) {
    counts[row.migration]++
  }

  return counts
}
