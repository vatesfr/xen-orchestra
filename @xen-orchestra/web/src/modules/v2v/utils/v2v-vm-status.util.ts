import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import type { V2vNextTransfer, V2vVmStatus } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { getV2vImportState, type V2vImportVm } from '@/modules/v2v/utils/v2v-import-markers.util.ts'
import { V2V_SNAPSHOT_NAME, V2V_TASK_PROPERTY, V2V_VM_OTHER_CONFIG, type XoV2vVm } from '@vates/types'

export type V2vImportSnapshot = Pick<FrontXoVmSnapshot, '$snapshot_of' | 'name_label' | 'snapshot_time'>

// From the start of a migration to its end: the order statuses are listed in. `getV2vVmStatus` returning a
// `V2vVmStatus` keeps every import state listed
export const V2V_VM_STATUSES = ['none', 'running', 'warm', 'cold'] as const

// Task properties are untyped: the ids are only trusted when they are strings
export function getRunningV2vSourceVmIds(tasks: Pick<FrontXoTask, 'status' | 'properties'>[]): Set<XoV2vVm['id']> {
  const sourceVmIds = new Set<XoV2vVm['id']>()

  for (const task of tasks) {
    const taskSourceVmIds = task.properties[V2V_TASK_PROPERTY.SOURCE_VM_IDS]
    const isRunningImport = task.status === 'pending' && Array.isArray(taskSourceVmIds)

    if (!isRunningImport) {
      continue
    }

    for (const sourceVmId of taskSourceVmIds) {
      if (typeof sourceVmId === 'string') {
        sourceVmIds.add(sourceVmId as XoV2vVm['id'])
      }
    }
  }

  return sourceVmIds
}

// Only a task can tell a running import: a VM whose import is neither warm nor cold yet is not migrated
export function getV2vVmStatus(importVm: V2vImportVm | undefined, isRunning: boolean): V2vVmStatus {
  if (isRunning) {
    return 'running'
  }

  if (importVm === undefined) {
    return 'none'
  }

  return getV2vImportState(importVm) ?? 'none'
}

export function getV2vLastSyncAt(importVmSnapshots: V2vImportSnapshot[]): number | undefined {
  const syncTimes = importVmSnapshots
    .filter(snapshot => snapshot.name_label === V2V_SNAPSHOT_NAME.AFTER_PARTIAL_IMPORT)
    .map(snapshot => snapshot.snapshot_time)

  // `snapshot_time` is in seconds, the front dates in milliseconds
  return syncTimes.length === 0 ? undefined : Math.max(...syncTimes) * 1000
}

// Same rule as the import (`#findBaseVM`): a delta only applies on top of the source snapshot the import last synced,
// which a resumable import always records
export function getV2vNextTransfer(
  vm: Pick<XoV2vVm, 'currentSnapshotId'>,
  importVm: Pick<V2vImportVm, 'other'>
): V2vNextTransfer {
  const isSyncedSnapshot =
    vm.currentSnapshotId !== undefined &&
    vm.currentSnapshotId === importVm.other[V2V_VM_OTHER_CONFIG.SOURCE_SNAPSHOT_ID]

  return isSyncedSnapshot ? 'delta' : 'full'
}
