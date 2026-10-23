import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { SDN_CONTROLLER_OF_RULES_KEY, type TrafficRule } from '@vates/types'
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

  const trafficRules = computed<TrafficRule[]>(() => {
    const filteredVifs = vifs.value.filter(vif => getVmById(vif.$VM))

    return [
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
  })

  return { trafficRules }
}
