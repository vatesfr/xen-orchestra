import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { taskCollectionMock } from '@/test/mock-xo-task-collection.ts'
import { v2vVmRowsCollectionsMock } from '@/test/mock-xo-v2v-vm-rows-collections.ts'
import { vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'
import { vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'
import type { Ref } from 'vue'

const holdLoading = (isReady: Ref<boolean>) => () => {
  isReady.value = false
}

// Holds a mocked collection as still loading (`mock-xo-collections.ts`, `mock-xo-vm-collection.ts`,
// `mock-xo-task-collection.ts`, `mock-xo-vm-device-collections.ts`, and the V2V VM rows mock built on them), by its
// name
export const HOLD_LOADING = {
  hosts: holdLoading(xoCollectionsMock.areHostsReady),
  networks: holdLoading(xoCollectionsMock.areNetworksReady),
  pools: holdLoading(xoCollectionsMock.arePoolsReady),
  snapshots: holdLoading(v2vVmRowsCollectionsMock.areSnapshotsReady),
  SRs: holdLoading(xoCollectionsMock.areSrsReady),
  tasks: holdLoading(taskCollectionMock.areTasksReady),
  templates: holdLoading(xoCollectionsMock.areTemplatesReady),
  VBDs: holdLoading(vmDeviceCollectionsMock.areVbdsReady),
  VDIs: holdLoading(vmDeviceCollectionsMock.areVdisReady),
  VIFs: holdLoading(vmDeviceCollectionsMock.areVifsReady),
  VMs: holdLoading(vmCollectionMock.areVmsReady),
}

/**
 * Registers the tests of a ready flag: true once every collection it waits for is loaded, false while each one still
 * loads, held after the mount. With `busy`, the tests of a busy flag instead: the other way round. `mountFlag` mounts
 * the code under test and returns a reader of the flag; `collections` are the collections it waits for, each with its
 * name in the test names.
 */
export function itIsReadyOnceLoaded(
  mountFlag: () => (() => boolean) | Promise<() => boolean>,
  collections: [name: string, collection: keyof typeof HOLD_LOADING][],
  { busy = false } = {}
) {
  it(`is ${!busy} once every collection it waits for is loaded`, async () => {
    expect((await mountFlag())()).toBe(!busy)
  })

  it.each(collections)(`is ${busy} while %s load`, async (_, collection) => {
    const readFlag = await mountFlag()

    HOLD_LOADING[collection]()

    expect(readFlag()).toBe(busy)
  })
}
