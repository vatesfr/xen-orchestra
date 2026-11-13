import {
  type FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useTrafficRules } from '@/modules/traffic-rules/composables/traffic-rules.composable.ts'
import { getNewTrafficRulePriority } from '@/modules/traffic-rules/utils/xo-traffic-rule.util.ts'
import { type FrontXoVif, useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { TrafficRuleTargetType } from '@vates/types'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useNewTrafficRulePriority(
  rawTargetType: MaybeRefOrGetter<TrafficRuleTargetType>,
  rawTargetId: MaybeRefOrGetter<FrontXoNetwork['id'] | FrontXoVif['id'] | undefined>,
  rawIsPrioritySupported: MaybeRefOrGetter<boolean>
) {
  const targetType = toComputed(rawTargetType)
  const targetId = toComputed(rawTargetId)
  const isPrioritySupported = toComputed(rawIsPrioritySupported)

  const { useGetNetworkById } = useXoNetworkCollection()
  const { vifs, getVifById } = useXoVifCollection()

  const targetNetworkId = computed<FrontXoNetwork['id'] | undefined>(() => {
    if (targetId.value === undefined) {
      return undefined
    }

    if (targetType.value === 'network') {
      return targetId.value as FrontXoNetwork['id']
    }

    return getVifById(targetId.value as FrontXoVif['id'])?.$network
  })

  const targetNetwork = useGetNetworkById(() => targetNetworkId.value)

  const targetNetworkVifs = computed(() => vifs.value.filter(vif => vif.$network === targetNetworkId.value))

  const { trafficRules: targetNetworkRules } = useTrafficRules(targetNetworkVifs, () =>
    targetNetwork.value ? [targetNetwork.value] : []
  )

  const newRulePriority = computed(() => {
    if (!isPrioritySupported.value) {
      return undefined
    }

    return getNewTrafficRulePriority(targetNetworkRules.value)
  })

  const hasFreePriority = computed(() => {
    if (!isPrioritySupported.value) {
      return true
    }

    return newRulePriority.value !== undefined
  })

  return { targetNetwork, newRulePriority, hasFreePriority }
}
