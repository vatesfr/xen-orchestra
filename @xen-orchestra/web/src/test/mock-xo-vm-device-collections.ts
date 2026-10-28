import type {
  FrontXoVbd,
  useXoVbdCollection as realUseXoVbdCollection,
} from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type {
  FrontXoVdi,
  useXoVdiCollection as realUseXoVdiCollection,
} from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type {
  FrontXoVif,
  useXoVifCollection as realUseXoVifCollection,
} from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { ref } from 'vue'

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
  vifs: ref<FrontXoVif[]>([]),
  areVifsReady: ref(true),
  reset() {
    this.vbds.value = []
    this.areVbdsReady.value = true
    this.vdis.value = []
    this.areVdisReady.value = true
    this.vifs.value = []
    this.areVifsReady.value = true
  },
}

// Use as `vi.mock(import('<collection module>'), () => import('@/test/mock-xo-vm-device-collections.ts'))`
// for each collection below: every mocked module picks its own export
export const useXoVbdCollection = (() => ({
  vbds: vmDeviceCollectionsMock.vbds,
  areVbdsReady: vmDeviceCollectionsMock.areVbdsReady,
  getVbdsByIds: (ids: FrontXoVbd['id'][]) => filterByIds(vmDeviceCollectionsMock.vbds.value, ids),
})) as unknown as typeof realUseXoVbdCollection

export const useXoVdiCollection = (() => ({
  vdis: vmDeviceCollectionsMock.vdis,
  areVdisReady: vmDeviceCollectionsMock.areVdisReady,
})) as unknown as typeof realUseXoVdiCollection

export const useXoVifCollection = (() => ({
  vifs: vmDeviceCollectionsMock.vifs,
  areVifsReady: vmDeviceCollectionsMock.areVifsReady,
  getVifsByIds: (ids: FrontXoVif['id'][]) => filterByIds(vmDeviceCollectionsMock.vifs.value, ids),
})) as unknown as typeof realUseXoVifCollection
