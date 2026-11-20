import type {
  FrontXoVmSnapshot,
  useXoVmSnapshotCollection as realUseXoVmSnapshotCollection,
} from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { createMockCollection } from '@/test/find-by-id.ts'
import { mockXoTaskCollection, taskCollectionMock } from '@/test/mock-xo-task-collection.ts'
import { mockXoVmCollection, vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'
import { mockModule } from '@/test/spy-on-module.ts'
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

// Mocked with `mockXoV2vVmRowsCollections()`
export const useXoVmSnapshotCollection = (() => ({
  ...createMockCollection(
    'Snapshot',
    'Snapshots',
    v2vVmRowsCollectionsMock.snapshots,
    v2vVmRowsCollectionsMock.areSnapshotsReady
  ),
})) as unknown as typeof realUseXoVmSnapshotCollection

// Replaces the three collection modules in every test of the file: call it at the top level of the test file
export function mockXoV2vVmRowsCollections() {
  mockModule(
    import('@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'),
    () => import('@/test/mock-xo-v2v-vm-rows-collections.ts')
  )
  mockXoTaskCollection()
  mockXoVmCollection()
}
