import type {
  FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useNewTrafficRulePriority } from '@/modules/traffic-rules/composables/use-new-traffic-rule-priority.composable.ts'
import type { FrontXoVif, useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createVif } from '@/test/create-vif.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { SDN_CONTROLLER_OF_RULES_KEY, type TrafficRuleTargetType } from '@vates/types'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

const { collections } = vi.hoisted(() => ({
  collections: { networks: [] as FrontXoNetwork[], vifs: [] as FrontXoVif[] },
}))

// The collections would open SSE subscriptions
vi.mock(import('@/modules/network/remote-resources/use-xo-network-collection.ts'), () => ({
  useXoNetworkCollection: (() => {
    const getNetworkById = (id: FrontXoNetwork['id'] | undefined) =>
      collections.networks.find(network => network.id === id)

    return {
      getNetworkById,
      useGetNetworkById: (rawId: MaybeRefOrGetter<FrontXoNetwork['id'] | undefined>) =>
        computed(() => getNetworkById(toValue(rawId))),
    }
  }) as unknown as typeof useXoNetworkCollection,
}))

vi.mock(import('@/modules/vif/remote-resources/use-xo-vif-collection.ts'), () => ({
  useXoVifCollection: (() => ({
    vifs: computed(() => collections.vifs),
    getVifById: (id: FrontXoVif['id']) => collections.vifs.find(vif => vif.id === id),
  })) as unknown as typeof useXoVifCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({
    getVmById: () => ({ name_label: 'VM' }),
  })) as unknown as typeof useXoVmCollection,
}))

function withRules(...priorities: number[]) {
  const rules = priorities.map(priority =>
    JSON.stringify({ allow: true, direction: 'from', ipRange: '10.0.0.1', protocol: 'ICMP', priority })
  )

  return { [SDN_CONTROLLER_OF_RULES_KEY]: JSON.stringify(rules) }
}

const network = createNetwork({ id: 'network-1' as FrontXoNetwork['id'], other_config: withRules(500) })
const otherNetwork = createNetwork({ id: 'network-2' as FrontXoNetwork['id'], other_config: withRules(100) })
const vif = createVif({ id: 'vif-1' as FrontXoVif['id'], $network: network.id, other_config: withRules(300) })
const otherVif = createVif({ id: 'vif-2' as FrontXoVif['id'], $network: otherNetwork.id, other_config: withRules(50) })

beforeEach(() => {
  collections.networks = [network, otherNetwork]
  collections.vifs = [vif, otherVif]
})

function mountPriority(
  targetType: TrafficRuleTargetType,
  targetId: FrontXoNetwork['id'] | FrontXoVif['id'] | undefined,
  isPrioritySupported = true
) {
  return mountComposable(() => useNewTrafficRulePriority(targetType, targetId, isPrioritySupported)).wrapper.vm
}

describe('newRulePriority', () => {
  it('goes below the network and VIF rules of the target network', () => {
    expect(mountPriority('network', network.id).newRulePriority).toBe(290)
  })

  it('looks at the network of the target VIF', () => {
    expect(mountPriority('VIF', vif.id).newRulePriority).toBe(290)
  })

  it('ignores the rules of the other networks', () => {
    expect(mountPriority('network', otherNetwork.id).newRulePriority).toBe(40)
  })

  it('is undefined when the priority is not supported', () => {
    expect(mountPriority('network', network.id, false).newRulePriority).toBeUndefined()
  })
})

describe('targetNetwork', () => {
  it('is the network of the target VIF', () => {
    expect(mountPriority('VIF', vif.id).targetNetwork).toEqual(network)
  })
})

describe('hasFreePriority', () => {
  it('is true when a priority is left below the rules of the network', () => {
    expect(mountPriority('network', network.id).hasFreePriority).toBe(true)
  })

  it('is false when a rule of the network has the lowest allowed priority', () => {
    collections.vifs = [createVif({ id: vif.id, $network: network.id, other_config: withRules(1) })]

    expect(mountPriority('network', network.id).hasFreePriority).toBe(false)
  })

  it('is true when the priority is not supported', () => {
    collections.vifs = [createVif({ id: vif.id, $network: network.id, other_config: withRules(1) })]

    expect(mountPriority('network', network.id, false).hasFreePriority).toBe(true)
  })

  it('is true without a target', () => {
    expect(mountPriority('network', undefined).hasFreePriority).toBe(true)
  })
})
