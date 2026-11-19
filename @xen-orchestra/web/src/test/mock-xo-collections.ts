import type {
  FrontXoHost,
  useXoHostCollection as realUseXoHostCollection,
} from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type {
  FrontXoNetwork,
  useXoNetworkCollection as realUseXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getEncryptedEncapsulationsByPool } from '@/modules/network/utils/xo-network.util.ts'
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
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type {
  FrontXoVmTemplate,
  useXoVmTemplateCollection as realUseXoVmTemplateCollection,
} from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import { createPool } from '@/test/create-pool.ts'
import { createMockCollection, findById } from '@/test/find-by-id.ts'
import { groupBy } from '@/test/group-by.ts'
import { computed, type MaybeRefOrGetter, ref } from 'vue'

// Shared state of the mocked collections: a test sets the objects it needs, reset it in `beforeEach`
export const xoCollectionsMock = {
  pools: ref<FrontXoPool[]>([]),
  arePoolsReady: ref(true),
  hasPoolFetchError: ref(false),
  hosts: ref<FrontXoHost[]>([]),
  areHostsReady: ref(true),
  hasHostFetchError: ref(false),
  srs: ref<FrontXoSr[]>([]),
  areSrsReady: ref(true),
  hasSrFetchError: ref(false),
  pbds: ref<FrontXoPbd[]>([]),
  networks: ref<FrontXoNetwork[]>([]),
  areNetworksReady: ref(true),
  pifs: ref<FrontXoPif[]>([]),
  vdiIsosBySrName: ref<Record<string, FrontXoVdi[]>>({}),
  templates: ref<FrontXoVmTemplate[]>([]),
  areTemplatesReady: ref(true),
  // The `isEnabled` option each collection was last called with
  isEnabled: {} as Partial<Record<'pool' | 'host' | 'sr', MaybeRefOrGetter<boolean>>>,
  reset() {
    this.pools.value = []
    this.arePoolsReady.value = true
    this.hasPoolFetchError.value = false
    this.hosts.value = []
    this.areHostsReady.value = true
    this.hasHostFetchError.value = false
    this.srs.value = []
    this.areSrsReady.value = true
    this.hasSrFetchError.value = false
    this.pbds.value = []
    this.networks.value = []
    this.areNetworksReady.value = true
    this.pifs.value = []
    this.vdiIsosBySrName.value = {}
    this.templates.value = []
    this.areTemplatesReady.value = true
    this.isEnabled = {}
  },
  // A host leads its pool once that pool names it its master
  seedMasterHost(host: FrontXoHost) {
    this.pools.value = [createPool({ id: host.$pool, master: host.id })]
  },
  // The pools of a loading collection: none yet, and not ready
  startLoadingPools() {
    this.pools.value = []
    this.arePoolsReady.value = false
  },
}

type CollectionOptions = { isEnabled?: MaybeRefOrGetter<boolean> }

// A collection that records the `isEnabled` option it is called with
function recordingIsEnabled<TCollection>(
  name: keyof typeof xoCollectionsMock.isEnabled,
  getCollection: () => TCollection
) {
  return (options?: CollectionOptions) => {
    xoCollectionsMock.isEnabled[name] = options?.isEnabled

    return getCollection()
  }
}

// Use as `mockModule(import('<collection module>'), () => import('@/test/mock-xo-collections.ts'))`
// for each collection below: every mocked module picks its own export
export const useXoPoolCollection = recordingIsEnabled('pool', () => ({
  ...createMockCollection('Pool', 'Pools', xoCollectionsMock.pools, xoCollectionsMock.arePoolsReady),
  hasPoolFetchError: xoCollectionsMock.hasPoolFetchError,
  hasPoolById: (id: FrontXoPool['id']) => findById(xoCollectionsMock.pools.value, id) !== undefined,
})) as unknown as typeof realUseXoPoolCollection

// The master of a pool is the host its `master` names, as in the real collection
function getMasterHostByPoolId(poolId: FrontXoPool['id']) {
  const masterHostId = findById(xoCollectionsMock.pools.value, poolId)?.master

  return masterHostId === undefined ? undefined : findById(xoCollectionsMock.hosts.value, masterHostId)
}

export const useXoHostCollection = recordingIsEnabled('host', () => ({
  ...createMockCollection('Host', 'Hosts', xoCollectionsMock.hosts, xoCollectionsMock.areHostsReady),
  areHostsFetching: ref(false),
  hasHostFetchError: xoCollectionsMock.hasHostFetchError,
  hostsByPool: computed(() => groupBy(xoCollectionsMock.hosts.value, host => host.$pool)),
  isMasterHost: (hostId: FrontXoHost['id']) => xoCollectionsMock.pools.value.some(pool => pool.master === hostId),
  getMasterHostByPoolId,
})) as unknown as typeof realUseXoHostCollection

export const useXoSrCollection = recordingIsEnabled('sr', () => ({
  ...createMockCollection('Sr', 'Srs', xoCollectionsMock.srs, xoCollectionsMock.areSrsReady),
  hasSrFetchError: xoCollectionsMock.hasSrFetchError,
  vdiIsosBySrName: xoCollectionsMock.vdiIsosBySrName,
})) as unknown as typeof realUseXoSrCollection

export const useXoNetworkCollection = (() => ({
  ...createMockCollection('Network', 'Networks', xoCollectionsMock.networks, xoCollectionsMock.areNetworksReady),
  encryptedEncapsulationsByPool: computed(() => getEncryptedEncapsulationsByPool(xoCollectionsMock.networks.value)),
})) as unknown as typeof realUseXoNetworkCollection

export const useXoPbdCollection = (() => ({
  pbdsBySr: computed(() => groupBy(xoCollectionsMock.pbds.value, pbd => pbd.SR)),
  ...createMockCollection('Pbd', 'Pbds', xoCollectionsMock.pbds),
})) as unknown as typeof realUseXoPbdCollection

export const useXoPifCollection = (() => ({
  ...createMockCollection('Pif', 'Pifs', xoCollectionsMock.pifs),
  pifsByHost: computed(() => groupBy(xoCollectionsMock.pifs.value, pif => pif.$host)),
  getPifsByNetworkId: (networkId: FrontXoNetwork['id']) =>
    xoCollectionsMock.pifs.value.filter(pif => pif.$network === networkId),
})) as unknown as typeof realUseXoPifCollection

export const useXoVmTemplateCollection = (() => ({
  ...createMockCollection('Template', 'Templates', xoCollectionsMock.templates, xoCollectionsMock.areTemplatesReady),
  vmsTemplatesByPool: computed(() => groupBy(xoCollectionsMock.templates.value, template => template.$pool)),
})) as unknown as typeof realUseXoVmTemplateCollection
