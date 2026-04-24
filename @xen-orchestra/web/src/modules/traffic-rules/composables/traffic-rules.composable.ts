import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { OF_RULES_KEY, type TrafficRule } from '@/modules/traffic-rules/types.ts'
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

function hashRule(rule: any) {
  const serializedRule = JSON.stringify(rule)
  let hash = 0
  for (let index = 0; index < serializedRule.length; index++) {
    hash = (Math.imul(31, hash) + serializedRule.charCodeAt(index)) | 0
  }
  return hash
}

export function useTrafficRules(
  rawVifs: MaybeRefOrGetter<FrontXoVif[]>,
  rawNetworks: MaybeRefOrGetter<FrontXoNetwork[]>
) {
  const vifs = toComputed(rawVifs)

  const networks = toComputed(rawNetworks)

  const { getVmById } = useXoVmCollection()

  const trafficRules = computed<TrafficRule[]>(() => {
    const sortedNetworks = [...networks.value].sort((a, b) => (a.name_label ?? '').localeCompare(b.name_label ?? ''))

    const sortedVifs = [...vifs.value].sort((a, b) => {
      const vmA = getVmById(a.$VM)?.name_label ?? ''
      const vmB = getVmById(b.$VM)?.name_label ?? ''
      const vmComparison = vmA.localeCompare(vmB)

      if (vmComparison !== 0) {
        return vmComparison
      }

      return Number(a.device) - Number(b.device)
    })

    return [
      ...sortedNetworks.flatMap(network =>
        parseRules(network.other_config?.[OF_RULES_KEY]).map(rule => ({
          ...rule,
          id: `network:${hashRule({ parent: network.id, rule })}`,
          sourceId: network.id,
          type: 'network' as const,
          networkId: network.id,
        }))
      ),
      ...sortedVifs.flatMap(vif =>
        parseRules(vif.other_config?.[OF_RULES_KEY]).map(rule => ({
          ...rule,
          id: `VIF:${hashRule({ parent: vif.id, rule })}`,
          sourceId: vif.id,
          type: 'VIF' as const,
          networkId: vif.$network,
        }))
      ),
    ]
  })

  return { trafficRules }
}
