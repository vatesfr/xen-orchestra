import type {
  FrontXoVmSnapshot,
  useXoVmSnapshotCollection as realUseXoVmSnapshotCollection,
} from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import type {
  FrontXoTask,
  useXoTaskCollection as realUseXoTaskCollection,
} from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import type {
  FrontXoVm,
  useXoVmCollection as realUseXoVmCollection,
} from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { ref } from 'vue'

// Shared state of the mocked collections the V2V VM rows are built from: a test sets the objects it needs, reset it
// in `beforeEach`
export const v2vVmRowsCollectionsMock = {
  vms: ref<FrontXoVm[]>([]),
  areVmsReady: ref(true),
  tasks: ref<FrontXoTask[]>([]),
  areTasksReady: ref(true),
  snapshots: ref<FrontXoVmSnapshot[]>([]),
  areSnapshotsReady: ref(true),
  reset() {
    this.vms.value = []
    this.areVmsReady.value = true
    this.tasks.value = []
    this.areTasksReady.value = true
    this.snapshots.value = []
    this.areSnapshotsReady.value = true
  },
}

// Use as `vi.mock(import('<collection module>'), () => import('@/test/mock-xo-v2v-vm-rows-collections.ts'))`
// for each collection below: every mocked module picks its own export
export const useXoVmCollection = (() => ({
  vms: v2vVmRowsCollectionsMock.vms,
  areVmsReady: v2vVmRowsCollectionsMock.areVmsReady,
})) as unknown as typeof realUseXoVmCollection

export const useXoTaskCollection = (() => ({
  tasks: v2vVmRowsCollectionsMock.tasks,
  areTasksReady: v2vVmRowsCollectionsMock.areTasksReady,
})) as unknown as typeof realUseXoTaskCollection

export const useXoVmSnapshotCollection = (() => ({
  snapshots: v2vVmRowsCollectionsMock.snapshots,
  areSnapshotsReady: v2vVmRowsCollectionsMock.areSnapshotsReady,
})) as unknown as typeof realUseXoVmSnapshotCollection
