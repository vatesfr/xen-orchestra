import type {
  FrontXoVbd,
  useXoVbdCollection as realUseXoVbdCollection,
} from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type {
  FrontXoVdi,
  useXoVdiCollection as realUseXoVdiCollection,
} from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type {
  FrontXoVdiSnapshot,
  useXoVdiSnapshotCollection as realUseXoVdiSnapshotCollection,
} from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import type {
  FrontXoVif,
  useXoVifCollection as realUseXoVifCollection,
} from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { createMockCollection } from '@/test/find-by-id.ts'
import { defineModuleMocks } from '@/test/spy-on-module.ts'
import { ref } from 'vue'

// Shared state of the mocked collections of the disks and network interfaces of XO VMs: a test sets the objects it
// needs, reset it in `beforeEach`
export const vmDeviceCollectionsMock = {
  vbds: ref<FrontXoVbd[]>([]),
  areVbdsReady: ref(true),
  vdis: ref<FrontXoVdi[]>([]),
  areVdisReady: ref(true),
  vdiSnapshots: ref<FrontXoVdiSnapshot[]>([]),
  vifs: ref<FrontXoVif[]>([]),
  areVifsReady: ref(true),
  reset() {
    this.vbds.value = []
    this.areVbdsReady.value = true
    this.vdis.value = []
    this.areVdisReady.value = true
    this.vdiSnapshots.value = []
    this.vifs.value = []
    this.areVifsReady.value = true
  },
}

// Mocked with `mockXoVmDeviceCollections(...collections)`: every mocked module picks its own export
export const useXoVbdCollection = (() => ({
  ...createMockCollection('Vbd', 'Vbds', vmDeviceCollectionsMock.vbds, vmDeviceCollectionsMock.areVbdsReady),
})) as unknown as typeof realUseXoVbdCollection

export const useXoVdiCollection = (() => ({
  ...createMockCollection('Vdi', 'Vdis', vmDeviceCollectionsMock.vdis, vmDeviceCollectionsMock.areVdisReady),
})) as unknown as typeof realUseXoVdiCollection

export const useXoVdiSnapshotCollection = (() => ({
  ...createMockCollection('VdiSnapshot', 'VdiSnapshots', vmDeviceCollectionsMock.vdiSnapshots),
})) as unknown as typeof realUseXoVdiSnapshotCollection

export const useXoVifCollection = (() => ({
  ...createMockCollection('Vif', 'Vifs', vmDeviceCollectionsMock.vifs, vmDeviceCollectionsMock.areVifsReady),
})) as unknown as typeof realUseXoVifCollection

// Replaces the modules of the given collections in every test of the file: call it at the top level of the test file
export const mockXoVmDeviceCollections = defineModuleMocks(
  {
    vbd: () => import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'),
    vdi: () => import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'),
    vdiSnapshot: () => import('@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'),
    vif: () => import('@/modules/vif/remote-resources/use-xo-vif-collection.ts'),
  },
  () => import('@/test/mock-xo-vm-device-collections.ts')
)
