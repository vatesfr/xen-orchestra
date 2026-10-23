import {
  type FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { RankedTrafficRule } from '@/modules/traffic-rules/types.ts'
import { getTrafficRulePriority } from '@/modules/traffic-rules/utils/xo-traffic-rule.util.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { SDN_CONTROLLER_OF_RULES_KEY, type TrafficRule, type XoNetwork } from '@vates/types'
import { computed, type MaybeRefOrGetter } from 'vue'

function parseRules(raw: string | undefined) {
  if (!raw) {
    return []
  }
  return (JSON.parse(raw) as string[]).map(entry => JSON.parse(entry))
}

export function useTrafficRules(
  rawVifs: MaybeRefOrGetter<FrontXoVif[]>,
  rawNetworks: MaybeRefOrGetter<FrontXoNetwork[]>
) {
  const vifs = toComputed(rawVifs)

  const networks = toComputed(rawNetworks)

  const { getVmById } = useXoVmCollection()

  const { getNetworkById } = useXoNetworkCollection()

  const trafficRules = computed<RankedTrafficRule[]>(() => {
    const filteredVifs = vifs.value.filter(vif => getVmById(vif.$VM))

    const rules: TrafficRule[] = [
      ...networks.value.flatMap(network =>
        parseRules(network.other_config?.[SDN_CONTROLLER_OF_RULES_KEY]).map((rule, index) => ({
          ...rule,
          id: `network:${network.id}:${index}`,
          sourceId: network.id,
          type: 'network' as const,
          networkId: network.id,
        }))
      ),
      ...filteredVifs.flatMap(vif =>
        parseRules(vif.other_config?.[SDN_CONTROLLER_OF_RULES_KEY]).map((rule, index) => ({
          ...rule,
          id: `VIF:${vif.id}:${index}`,
          sourceId: vif.id,
          type: 'VIF' as const,
          networkId: vif.$network,
        }))
      ),
    ]

    const sortedRules = rules.sort((ruleA, ruleB) => {
      const networkLabelA = getNetworkById(ruleA.networkId)?.name_label ?? ''
      const networkLabelB = getNetworkById(ruleB.networkId)?.name_label ?? ''
      const networkComparison = networkLabelA.localeCompare(networkLabelB)

      if (networkComparison !== 0) {
        return networkComparison
      }

      return getTrafficRulePriority(ruleB) - getTrafficRulePriority(ruleA)
    })

    const lastRankByNetworkId = new Map<XoNetwork['id'], number>()

    return sortedRules.map(rule => {
      const lastRank = lastRankByNetworkId.get(rule.networkId)

      let rank = 1

      if (lastRank !== undefined) {
        rank = lastRank + 1
      }

      lastRankByNetworkId.set(rule.networkId, rank)

      return { ...rule, rank }
    })
  })

  return { trafficRules }
}
