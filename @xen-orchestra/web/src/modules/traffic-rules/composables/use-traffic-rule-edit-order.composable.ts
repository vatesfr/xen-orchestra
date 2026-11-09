import {
  type FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoTrafficRuleEditOrderJob } from '@/modules/traffic-rules/jobs/xo-traffic-rule-edit-order.job.ts'
import type { RankedTrafficRule } from '@/modules/traffic-rules/types.ts'
import { getNetworkRules, isNetworkRuleSupported } from '@/modules/traffic-rules/utils/xo-traffic-rule.util.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, ref } from 'vue'

export function useTrafficRuleEditOrder(
  rawNetworkId: MaybeRefOrGetter<FrontXoNetwork['id']>,
  rawTrafficRules: MaybeRefOrGetter<RankedTrafficRule[]>
) {
  const { getNetworkById } = useXoNetworkCollection()

  const { getPoolById } = useXoPoolCollection()

  const networkId = toComputed(rawNetworkId)

  const trafficRules = toComputed(rawTrafficRules)

  const network = computed(() => getNetworkById(networkId.value))

  const networkRules = computed(() => getNetworkRules(trafficRules.value, networkId.value))

  const isXapiPluginRequired = computed(() => {
    if (network.value === undefined) {
      return false
    }

    const pool = getPoolById(network.value.$pool)

    return !isNetworkRuleSupported(pool)
  })

  const orderedRules = ref<RankedTrafficRule[] | undefined>(undefined)

  const {
    run,
    canRun: canEditTrafficRulesOrder,
    isRunning: isEditingTrafficRulesOrder,
    errorMessage: editTrafficRulesOrderErrorMessage,
  } = useXoTrafficRuleEditOrderJob(networkRules, orderedRules, network)

  const { open } = useOverlay({
    component: () => import('@/modules/traffic-rules/components/drawer/TrafficRuleEditOrderDrawer.vue'),
    events: {
      onConfirm: (newOrderedRules: RankedTrafficRule[]) => {
        orderedRules.value = newOrderedRules

        run({ detached: true })
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    network: network.value,
    rules: networkRules.value,
  }))

  function editTrafficRulesOrder() {
    return open({ props })
  }

  return {
    editTrafficRulesOrder,
    canEditTrafficRulesOrder,
    isEditingTrafficRulesOrder,
    editTrafficRulesOrderErrorMessage,
    isXapiPluginRequired,
  }
}
