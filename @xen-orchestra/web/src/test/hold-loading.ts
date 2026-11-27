import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { taskCollectionMock } from '@/test/mock-xo-task-collection.ts'
import { vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'

// Holds a mocked collection as still loading (`mock-xo-collections.ts`, `mock-xo-vm-collection.ts`,
// `mock-xo-task-collection.ts`, and the V2V VM rows mock built on them), by its name
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
  tasks: () => {
    taskCollectionMock.areTasksReady.value = false
  },
  templates: () => {
    xoCollectionsMock.areTemplatesReady.value = false
  },
  VMs: () => {
    vmCollectionMock.areVmsReady.value = false
  },
}
