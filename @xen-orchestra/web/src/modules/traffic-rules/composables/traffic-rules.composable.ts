import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { SDN_CONTROLLER_OF_RULES_KEY, type TrafficRule } from '@/modules/traffic-rules/types.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from '@vueuse/core'
import { computed } from 'vue'

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
    const sortedNetworks = [...networks.value].sort((networkA, networkB) =>
      (networkA.name_label ?? '').localeCompare(networkB.name_label ?? '')
    )

    const sortedVifs = [...vifs.value].sort((vifA, vifB) => {
      const vmNameLabelA = getVmById(vifA.$VM)?.name_label ?? ''
      const vmNameLabelB = getVmById(vifB.$VM)?.name_label ?? ''
      const vmComparison = vmNameLabelA.localeCompare(vmNameLabelB)

      if (vmComparison !== 0) {
        return vmComparison
      }

      return Number(vifA.device) - Number(vifB.device)
    })

    return [
      ...sortedNetworks.flatMap(network =>
        parseRules(network.other_config?.[SDN_CONTROLLER_OF_RULES_KEY]).map((rule, index) => ({
          ...rule,
          id: `network:${network.id}:${index}`,
          sourceId: network.id,
          type: 'network' as const,
          networkId: network.id,
        }))
      ),
      ...sortedVifs.flatMap(vif =>
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
