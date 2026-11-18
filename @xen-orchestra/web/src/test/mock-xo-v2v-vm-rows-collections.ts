import type {
  FrontXoVmSnapshot,
  useXoVmSnapshotCollection as realUseXoVmSnapshotCollection,
} from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { taskCollectionMock } from '@/test/mock-xo-task-collection.ts'
import { vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'
import { ref } from 'vue'

// Shared state of the mocked collections the V2V VM rows are built from: a test sets the objects it needs, reset it
// in `beforeEach`. The VMs are those of `mock-xo-vm-collection.ts`, the tasks those of `mock-xo-task-collection.ts`
export const v2vVmRowsCollectionsMock = {
  vms: vmCollectionMock.vms,
  areVmsReady: vmCollectionMock.areVmsReady,
  tasks: taskCollectionMock.tasks,
  areTasksReady: taskCollectionMock.areTasksReady,
  snapshots: ref<FrontXoVmSnapshot[]>([]),
  areSnapshotsReady: ref(true),
  reset() {
    vmCollectionMock.reset()
    taskCollectionMock.reset()
    this.snapshots.value = []
    this.areSnapshotsReady.value = true
  },
}

// Use as `mockModule(import('<collection module>'), () => import('@/test/mock-xo-v2v-vm-rows-collections.ts'))`
// for each collection below: every mocked module picks its own export
export { useXoVmCollection } from '@/test/mock-xo-vm-collection.ts'
export { useXoTaskCollection } from '@/test/mock-xo-task-collection.ts'

export const useXoVmSnapshotCollection = (() => ({
  snapshots: v2vVmRowsCollectionsMock.snapshots,
  areSnapshotsReady: v2vVmRowsCollectionsMock.areSnapshotsReady,
})) as unknown as typeof realUseXoVmSnapshotCollection
