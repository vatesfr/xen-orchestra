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
import { computed, type MaybeRefOrGetter, ref, toValue } from 'vue'

function filterByIds<TRecord extends { id: string }>(records: TRecord[], ids: string[]) {
  return records.filter(record => ids.includes(record.id))
}

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

// Use as `mockModule(import('<collection module>'), () => import('@/test/mock-xo-vm-device-collections.ts'))`
// for each collection below: every mocked module picks its own export
export const useXoVbdCollection = (() => ({
  vbds: vmDeviceCollectionsMock.vbds,
  areVbdsReady: vmDeviceCollectionsMock.areVbdsReady,
  getVbdById: (id: FrontXoVbd['id']) => vmDeviceCollectionsMock.vbds.value.find(vbd => vbd.id === id),
  getVbdsByIds: (ids: FrontXoVbd['id'][]) => filterByIds(vmDeviceCollectionsMock.vbds.value, ids),
})) as unknown as typeof realUseXoVbdCollection

export const useXoVdiCollection = (() => ({
  vdis: vmDeviceCollectionsMock.vdis,
  areVdisReady: vmDeviceCollectionsMock.areVdisReady,
  getVdiById: (id: FrontXoVdi['id']) => vmDeviceCollectionsMock.vdis.value.find(vdi => vdi.id === id),
})) as unknown as typeof realUseXoVdiCollection

export const useXoVdiSnapshotCollection = (() => ({
  vdiSnapshots: vmDeviceCollectionsMock.vdiSnapshots,
  getVdiSnapshotById: (id: FrontXoVdiSnapshot['id']) =>
    vmDeviceCollectionsMock.vdiSnapshots.value.find(vdiSnapshot => vdiSnapshot.id === id),
})) as unknown as typeof realUseXoVdiSnapshotCollection

export const useXoVifCollection = (() => ({
  vifs: vmDeviceCollectionsMock.vifs,
  areVifsReady: vmDeviceCollectionsMock.areVifsReady,
  getVifsByIds: (ids: FrontXoVif['id'][]) => filterByIds(vmDeviceCollectionsMock.vifs.value, ids),
  getVifById: (id: FrontXoVif['id'] | undefined) => vmDeviceCollectionsMock.vifs.value.find(vif => vif.id === id),
  useGetVifById: (id: MaybeRefOrGetter<FrontXoVif['id'] | undefined>) =>
    computed(() => vmDeviceCollectionsMock.vifs.value.find(vif => vif.id === toValue(id))),
})) as unknown as typeof realUseXoVifCollection
