import { useXoNetworkPoolGroups } from '@/modules/network/composables/xo-network-pool-groups.composable.ts'
import type {
  FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPif, useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { safePushInMap } from '@/shared/utils/map.util.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createPif } from '@/test/create-pif.ts'
import { createPool } from '@/test/create-pool.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { SDN_CONTROLLER_PRIVATE_NETWORK_UUID_KEY } from '@vates/types'
import { computed, type MaybeRefOrGetter, nextTick, ref } from 'vue'

const { networks, pools, pifs } = vi.hoisted(() => ({
  networks: { value: [] as FrontXoNetwork[] },
  pools: { value: [] as FrontXoPool[] },
  pifs: { value: [] as FrontXoPif[] },
}))

vi.mock(import('@/modules/network/remote-resources/use-xo-network-collection.ts'), () => ({
  useXoNetworkCollection: (() => ({
    privateNetworksByUuid: computed(() => {
      const networksByUuid = new Map<string, FrontXoNetwork[]>()

      networks.value.forEach(network => {
        safePushInMap(networksByUuid, network.other_config[SDN_CONTROLLER_PRIVATE_NETWORK_UUID_KEY], network)
      })

      return networksByUuid
    }),
  })) as unknown as typeof useXoNetworkCollection,
}))

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({
    getPoolById: (id: FrontXoPool['id']) => pools.value.find(pool => pool.id === id),
  })) as unknown as typeof useXoPoolCollection,
}))

vi.mock(import('@/modules/pif/remote-resources/use-xo-pif-collection.ts'), () => ({
  useXoPifCollection: (() => ({
    getPifsByNetworkId: (networkId: FrontXoNetwork['id']) => pifs.value.filter(pif => pif.$network === networkId),
  })) as unknown as typeof useXoPifCollection,
}))

const PRIVATE_NETWORK_UUID = 'private-network-uuid'

function createPoolNamed(name: string) {
  return createPool({ id: `pool-${name}` as FrontXoPool['id'], name_label: name })
}

function createPrivateNetworkOn(pool: FrontXoPool) {
  return createNetwork({
    id: `network-${pool.name_label}` as FrontXoNetwork['id'],
    $pool: pool.id,
    other_config: { [SDN_CONTROLLER_PRIVATE_NETWORK_UUID_KEY]: PRIVATE_NETWORK_UUID },
  })
}

function createPifOn(network: FrontXoNetwork, attached = true) {
  return createPif({
    id: `pif-${network.id}-${pifs.value.length}` as FrontXoPif['id'],
    $network: network.id,
    attached,
    carrier: true,
  })
}

// Seeds one pool, one private network and one PIF per name, all sharing the same private network
function seedPrivateNetworkPools(names: string[]) {
  pools.value = names.map(createPoolNamed)
  networks.value = pools.value.map(createPrivateNetworkOn)
  pifs.value = networks.value.map(network => createPifOn(network))

  return networks.value
}

function getNetworkNamed(name: string) {
  const network = networks.value.find(network => network.id === `network-${name}`)

  if (network === undefined) {
    throw new Error(`No seeded network on pool ${name}`)
  }

  return network
}

function mountPoolGroups(network: MaybeRefOrGetter<FrontXoNetwork>) {
  return mountComposable(() => useXoNetworkPoolGroups(network)).wrapper.vm
}

function getVisiblePoolNames(result: ReturnType<typeof mountPoolGroups>) {
  return result.visiblePoolGroupItems.map(group => group.pool?.name_label)
}

beforeEach(() => {
  networks.value = []
  pools.value = []
  pifs.value = []
})

describe('poolGroups', () => {
  it('is a single group for a network that is not private', () => {
    const pool = createPoolNamed('paris')
    const network = createNetwork({ $pool: pool.id })

    pools.value = [pool]
    pifs.value = [createPifOn(network)]

    const result = mountPoolGroups(network)

    expect(result.isCrossPool).toBe(false)
    expect(result.poolGroups.map(group => group.network.id)).toEqual([network.id])
  })

  it('is a single group for a private network on a single pool', () => {
    seedPrivateNetworkPools(['paris'])

    const result = mountPoolGroups(getNetworkNamed('paris'))

    expect(result.isCrossPool).toBe(false)
    expect(result.poolGroups.map(group => group.network.id)).toEqual([getNetworkNamed('paris').id])
  })

  it('groups a private network with the networks sharing its uuid, one per pool, sorted by pool name', () => {
    seedPrivateNetworkPools(['paris', 'lyon', 'nantes'])

    const result = mountPoolGroups(getNetworkNamed('paris'))

    expect(result.isCrossPool).toBe(true)
    expect(result.poolGroups.map(group => group.pool?.name_label)).toEqual(['lyon', 'nantes', 'paris'])
  })

  it('leaves out the pools that are not found, as the tree view does', () => {
    seedPrivateNetworkPools(['paris', 'lyon', 'nantes'])

    pools.value = pools.value.filter(pool => pool.name_label !== 'lyon')

    const result = mountPoolGroups(getNetworkNamed('paris'))

    expect(result.poolGroups.map(group => group.pool?.name_label)).toEqual(['nantes', 'paris'])
  })

  it('is a single group when fewer than 2 pools of the private network are found', () => {
    seedPrivateNetworkPools(['paris', 'lyon'])

    pools.value = pools.value.filter(pool => pool.name_label !== 'lyon')

    const result = mountPoolGroups(getNetworkNamed('paris'))

    expect(result.isCrossPool).toBe(false)
    expect(result.poolGroups.map(group => group.network.id)).toEqual([getNetworkNamed('paris').id])
  })

  it('leaves out the private networks of another uuid', () => {
    seedPrivateNetworkPools(['paris', 'lyon'])

    const otherNetwork = createNetwork({
      id: 'network-other' as FrontXoNetwork['id'],
      other_config: { [SDN_CONTROLLER_PRIVATE_NETWORK_UUID_KEY]: 'other-uuid' },
    })

    networks.value = [...networks.value, otherNetwork]

    const result = mountPoolGroups(getNetworkNamed('paris'))

    expect(result.poolGroups.map(group => group.network.id)).not.toContain(otherNetwork.id)
  })
})

describe('pifsCount', () => {
  it('counts the PIFs of every pool of the private network', () => {
    seedPrivateNetworkPools(['paris', 'lyon', 'nantes'])

    expect(mountPoolGroups(getNetworkNamed('paris')).pifsCount).toBe(3)
  })
})

describe('visiblePoolGroupItems', () => {
  it('flags the pool of the network as the current one', () => {
    seedPrivateNetworkPools(['paris', 'lyon'])

    const result = mountPoolGroups(getNetworkNamed('paris'))

    expect(result.visiblePoolGroupItems.map(group => group.isCurrent)).toEqual([false, true])
  })

  it('shows only the table of the current pool at first', () => {
    seedPrivateNetworkPools(['paris', 'lyon'])

    const result = mountPoolGroups(getNetworkNamed('paris'))

    expect(result.visiblePoolGroupItems.map(group => group.isTableVisible)).toEqual([false, true])
    expect(result.visiblePoolGroupItems.map(group => group.toggleIcon)).toEqual(['fa:angle-right', 'fa:angle-down'])
  })

  it('always shows the table of a network that is not private', () => {
    const network = createNetwork()

    expect(mountPoolGroups(network).visiblePoolGroupItems[0].isTableVisible).toBe(true)
  })

  it('always shows the table of a private network on a single pool', () => {
    seedPrivateNetworkPools(['paris'])

    expect(mountPoolGroups(getNetworkNamed('paris')).visiblePoolGroupItems[0].isTableVisible).toBe(true)
  })

  it('expands then collapses a pool when toggled', () => {
    seedPrivateNetworkPools(['paris', 'lyon'])

    const result = mountPoolGroups(getNetworkNamed('paris'))

    result.toggleNetwork(getNetworkNamed('lyon').id)

    expect(result.visiblePoolGroupItems[0].isTableVisible).toBe(true)

    result.toggleNetwork(getNetworkNamed('lyon').id)

    expect(result.visiblePoolGroupItems[0].isTableVisible).toBe(false)
  })

  it('gives the aggregated status of the PIFs of each pool', () => {
    seedPrivateNetworkPools(['paris'])

    pifs.value = [...pifs.value, createPifOn(getNetworkNamed('paris'), false)]

    expect(mountPoolGroups(getNetworkNamed('paris')).visiblePoolGroupItems[0].status).toBe('partially-connected')
  })

  it('shows the current pool with the 2 pools before and the 2 after when there are more than 5', () => {
    seedPrivateNetworkPools(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])

    const result = mountPoolGroups(getNetworkNamed('e'))

    expect(result.hasHiddenPoolGroups).toBe(true)
    expect(getVisiblePoolNames(result)).toEqual(['c', 'd', 'e', 'f', 'g'])
  })

  it('shows every pool once toggled', () => {
    seedPrivateNetworkPools(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])

    const result = mountPoolGroups(getNetworkNamed('e'))

    result.toggleAllPoolGroups()

    expect(getVisiblePoolNames(result)).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])
  })

  it('collapses back to the current pool when the network changes', async () => {
    seedPrivateNetworkPools(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])

    const network = ref(getNetworkNamed('e'))
    const result = mountPoolGroups(network)

    result.toggleAllPoolGroups()
    result.toggleNetwork(getNetworkNamed('a').id)

    network.value = getNetworkNamed('h')

    await nextTick()

    expect(getVisiblePoolNames(result)).toEqual(['d', 'e', 'f', 'g', 'h'])
    expect(
      result.visiblePoolGroupItems.filter(group => group.isTableVisible).map(group => group.pool?.name_label)
    ).toEqual(['h'])
  })
})

describe('allPoolGroupsToggleLabel', () => {
  it('offers to see every pool, then to see less once they are all shown', () => {
    seedPrivateNetworkPools(['a', 'b', 'c', 'd', 'e', 'f'])

    const result = mountPoolGroups(getNetworkNamed('a'))

    expect(result.allPoolGroupsToggleLabel).toBe(t('action:see-all'))

    result.toggleAllPoolGroups()

    expect(result.allPoolGroupsToggleLabel).toBe(t('action:see-less'))
  })
})
