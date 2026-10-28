import type {
  FrontXoHost,
  useXoHostCollection as realUseXoHostCollection,
} from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type {
  FrontXoNetwork,
  useXoNetworkCollection as realUseXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { useXoPbdCollection as realUseXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type {
  FrontXoPif,
  useXoPifCollection as realUseXoPifCollection,
} from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type {
  FrontXoPool,
  useXoPoolCollection as realUseXoPoolCollection,
} from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type {
  FrontXoSr,
  useXoSrCollection as realUseXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type {
  FrontXoVmTemplate,
  useXoVmTemplateCollection as realUseXoVmTemplateCollection,
} from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import { ref } from 'vue'

// Shared state of the mocked collections a destination is chosen from: a test sets the objects it needs,
// reset it in `beforeEach`
export const destinationCollectionsMock = {
  pools: ref<FrontXoPool[]>([]),
  arePoolsReady: ref(true),
  hosts: ref<FrontXoHost[]>([]),
  srs: ref<FrontXoSr[]>([]),
  networks: ref<FrontXoNetwork[]>([]),
  pifs: ref<FrontXoPif[]>([]),
  templates: ref<FrontXoVmTemplate[]>([]),
  reset() {
    this.pools.value = []
    this.arePoolsReady.value = true
    this.hosts.value = []
    this.srs.value = []
    this.networks.value = []
    this.pifs.value = []
    this.templates.value = []
  },
}

// Use as `vi.mock(import('<collection module>'), () => import('@/test/mock-xo-destination-collections.ts'))`
// for each collection below: every mocked module picks its own export
export const useXoPoolCollection = (() => ({
  pools: destinationCollectionsMock.pools,
  arePoolsReady: destinationCollectionsMock.arePoolsReady,
  getPoolById: (id: FrontXoPool['id'] | undefined) =>
    destinationCollectionsMock.pools.value.find(pool => pool.id === id),
  hasPoolById: (id: FrontXoPool['id']) => destinationCollectionsMock.pools.value.some(pool => pool.id === id),
})) as unknown as typeof realUseXoPoolCollection

export const useXoHostCollection = (() => ({
  hosts: destinationCollectionsMock.hosts,
})) as unknown as typeof realUseXoHostCollection

export const useXoSrCollection = (() => ({
  srs: destinationCollectionsMock.srs,
  getSrById: (id: FrontXoSr['id'] | undefined) => destinationCollectionsMock.srs.value.find(sr => sr.id === id),
})) as unknown as typeof realUseXoSrCollection

export const useXoNetworkCollection = (() => ({
  networks: destinationCollectionsMock.networks,
  getNetworkById: (id: FrontXoNetwork['id'] | undefined) =>
    destinationCollectionsMock.networks.value.find(network => network.id === id),
})) as unknown as typeof realUseXoNetworkCollection

// No PBD: the tests offer shared SRs, whose location needs none
export const useXoPbdCollection = (() => ({
  pbdsBySr: ref(new Map()),
})) as unknown as typeof realUseXoPbdCollection

export const useXoPifCollection = (() => ({
  pifs: destinationCollectionsMock.pifs,
})) as unknown as typeof realUseXoPifCollection

export const useXoVmTemplateCollection = (() => ({
  templates: destinationCollectionsMock.templates,
})) as unknown as typeof realUseXoVmTemplateCollection
