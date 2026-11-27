import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'

// Holds a mocked collection as still loading (`mock-xo-collections.ts`, `mock-xo-vm-collection.ts`), by its name
export const HOLD_LOADING = {
  hosts: () => {
    xoCollectionsMock.areHostsReady.value = false
  },
  pools: () => {
    xoCollectionsMock.arePoolsReady.value = false
  },
  SRs: () => {
    xoCollectionsMock.areSrsReady.value = false
  },
  templates: () => {
    xoCollectionsMock.areTemplatesReady.value = false
  },
  VMs: () => {
    vmCollectionMock.areVmsReady.value = false
  },
}
