import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { taskCollectionMock } from '@/test/mock-xo-task-collection.ts'
import { v2vVmRowsCollectionsMock } from '@/test/mock-xo-v2v-vm-rows-collections.ts'
import { vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'
import type { Ref } from 'vue'

const holdLoading = (isReady: Ref<boolean>) => () => {
  isReady.value = false
}

// Holds a mocked collection as still loading (`mock-xo-collections.ts`, `mock-xo-vm-collection.ts`,
// `mock-xo-task-collection.ts`, and the V2V VM rows mock built on them), by its name
export const HOLD_LOADING = {
  hosts: holdLoading(xoCollectionsMock.areHostsReady),
  networks: holdLoading(xoCollectionsMock.areNetworksReady),
  pools: holdLoading(xoCollectionsMock.arePoolsReady),
  snapshots: holdLoading(v2vVmRowsCollectionsMock.areSnapshotsReady),
  SRs: holdLoading(xoCollectionsMock.areSrsReady),
  tasks: holdLoading(taskCollectionMock.areTasksReady),
  templates: holdLoading(xoCollectionsMock.areTemplatesReady),
  VMs: holdLoading(vmCollectionMock.areVmsReady),
}
