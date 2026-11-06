import type {
  FrontXoHost,
  useXoHostCollection as realUseXoHostCollection,
} from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type {
  FrontXoNetwork,
  useXoNetworkCollection as realUseXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type {
  FrontXoPbd,
  useXoPbdCollection as realUseXoPbdCollection,
} from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
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
import { groupBy } from '@/test/group-by.ts'
import { computed, type MaybeRefOrGetter, ref, toValue } from 'vue'

// Shared state of the mocked collections: a test sets the objects it needs, reset it in `beforeEach`
export const xoCollectionsMock = {
  pools: ref<FrontXoPool[]>([]),
  arePoolsReady: ref(true),
  hosts: ref<FrontXoHost[]>([]),
  srs: ref<FrontXoSr[]>([]),
  areSrsReady: ref(true),
  pbds: ref<FrontXoPbd[]>([]),
  networks: ref<FrontXoNetwork[]>([]),
  areNetworksReady: ref(true),
  pifs: ref<FrontXoPif[]>([]),
  templates: ref<FrontXoVmTemplate[]>([]),
  areTemplatesReady: ref(true),
  // What the pool of a V2V list offers its VMs, as a step reads them
  seedChoices({
    srs,
    networks,
    templates,
  }: {
    srs: FrontXoSr[]
    networks: FrontXoNetwork[]
    templates: FrontXoVmTemplate[]
  }) {
    this.srs.value = srs
    this.networks.value = networks
    this.templates.value = templates
  },
  reset() {
    this.pools.value = []
    this.arePoolsReady.value = true
    this.hosts.value = []
    this.srs.value = []
    this.areSrsReady.value = true
    this.pbds.value = []
    this.networks.value = []
    this.areNetworksReady.value = true
    this.pifs.value = []
    this.templates.value = []
    this.areTemplatesReady.value = true
  },
}

// Use as `vi.mock(import('<collection module>'), () => import('@/test/mock-xo-collections.ts'))`
// for each collection below: every mocked module picks its own export
export const useXoPoolCollection = (() => ({
  pools: xoCollectionsMock.pools,
  arePoolsReady: xoCollectionsMock.arePoolsReady,
  getPoolById: (id: FrontXoPool['id'] | undefined) => xoCollectionsMock.pools.value.find(pool => pool.id === id),
  hasPoolById: (id: FrontXoPool['id']) => xoCollectionsMock.pools.value.some(pool => pool.id === id),
  useGetPoolById: (id: MaybeRefOrGetter<FrontXoPool['id'] | undefined>) =>
    computed(() => xoCollectionsMock.pools.value.find(pool => pool.id === toValue(id))),
})) as unknown as typeof realUseXoPoolCollection

export const useXoHostCollection = (() => ({
  hosts: xoCollectionsMock.hosts,
  getHostById: (id: FrontXoHost['id']) => xoCollectionsMock.hosts.value.find(host => host.id === id),
})) as unknown as typeof realUseXoHostCollection

export const useXoSrCollection = (() => ({
  srs: xoCollectionsMock.srs,
  areSrsReady: xoCollectionsMock.areSrsReady,
  getSrById: (id: FrontXoSr['id'] | undefined) => xoCollectionsMock.srs.value.find(sr => sr.id === id),
})) as unknown as typeof realUseXoSrCollection

export const useXoNetworkCollection = (() => ({
  networks: xoCollectionsMock.networks,
  areNetworksReady: xoCollectionsMock.areNetworksReady,
  getNetworkById: (id: FrontXoNetwork['id'] | undefined) =>
    xoCollectionsMock.networks.value.find(network => network.id === id),
})) as unknown as typeof realUseXoNetworkCollection

export const useXoPbdCollection = (() => ({
  pbdsBySr: computed(() => groupBy(xoCollectionsMock.pbds.value, pbd => pbd.SR)),
})) as unknown as typeof realUseXoPbdCollection

export const useXoPifCollection = (() => ({
  pifs: xoCollectionsMock.pifs,
})) as unknown as typeof realUseXoPifCollection

export const useXoVmTemplateCollection = (() => ({
  templates: xoCollectionsMock.templates,
  areTemplatesReady: xoCollectionsMock.areTemplatesReady,
})) as unknown as typeof realUseXoVmTemplateCollection
