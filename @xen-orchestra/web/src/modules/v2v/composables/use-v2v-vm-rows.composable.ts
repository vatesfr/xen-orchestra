import { useXoVmSnapshotCollection } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useV2vConnectionStore } from '@/modules/v2v/stores/v2v-connection.store.ts'
import type { V2vVmRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { getV2vImportVmsBySourceVmId } from '@/modules/v2v/utils/v2v-import-markers.util.ts'
import { buildV2vVmRows } from '@/modules/v2v/utils/v2v-vm-rows.util.ts'
import { getRunningV2vSourceVmIds } from '@/modules/v2v/utils/v2v-vm-status.util.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { XoV2vVm } from '@vates/types'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function useV2vVmRows(listVmIds: MaybeRefOrGetter<Set<XoV2vVm['id']>>) {
  const connectionStore = useV2vConnectionStore()

  const { vms, areVmsReady } = useXoVmCollection()

  const { tasks, areTasksReady } = useXoTaskCollection()

  const { snapshots, areSnapshotsReady } = useXoVmSnapshotCollection()

  // Indexed apart from the rows: adding a VM to the list must not walk every XO VM and task again
  const importVmsBySourceVmId = computed(() => {
    const sourceId = connectionStore.sourceId

    return sourceId === undefined ? undefined : getV2vImportVmsBySourceVmId(vms.value, sourceId)
  })

  const runningSourceVmIds = computed(() => getRunningV2vSourceVmIds(tasks.value))

  const rows = computed((): V2vVmRow[] => {
    const inventory = connectionStore.inventory
    const importVms = importVmsBySourceVmId.value

    // The source id comes with the inventory: both are missing until a source is connected
    if (inventory === undefined || importVms === undefined) {
      return []
    }

    return buildV2vVmRows({
      inventory,
      importVmsBySourceVmId: importVms,
      runningSourceVmIds: runningSourceVmIds.value,
      snapshots: snapshots.value,
      listVmIds: toValue(listVmIds),
    })
  })

  const areRowsReady = computed(() => areVmsReady.value && areTasksReady.value && areSnapshotsReady.value)

  return { rows, areRowsReady }
}
