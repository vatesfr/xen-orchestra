import type {
  FrontXoVm,
  useXoVmCollection as realUseXoVmCollection,
} from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { ref } from 'vue'

// Shared state of the mocked VM collection: a test sets the VMs it needs, reset it in `beforeEach`
export const vmCollectionMock = {
  vms: ref<FrontXoVm[]>([]),
  areVmsReady: ref(true),
  reset() {
    this.vms.value = []
    this.areVmsReady.value = true
  },
}

// Use as `vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => import('@/test/mock-xo-vm-collection.ts'))`
export const useXoVmCollection = (() => ({
  vms: vmCollectionMock.vms,
  areVmsReady: vmCollectionMock.areVmsReady,
})) as unknown as typeof realUseXoVmCollection
