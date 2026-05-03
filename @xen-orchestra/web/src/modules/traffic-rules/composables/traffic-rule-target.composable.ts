import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getPoolNetworkRoute } from '@/modules/network/utils/xo-network.util.ts'
import type { TrafficRule } from '@/modules/traffic-rules/types.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { LinkOptions } from '@core/composables/link-component.composable.ts'
import type { IconName } from '@core/icons'
import { toLower } from 'lodash-es'
import { useI18n } from 'vue-i18n'

type TrafficRuleTargetEntry = {
  label: string
  icon: IconName
  to: LinkOptions['to']
}

export type TrafficRuleTarget = TrafficRuleTargetEntry & {
  suffix?: TrafficRuleTargetEntry
}

export function useTrafficRuleTarget() {
  const { t } = useI18n()
  const { getVifById } = useXoVifCollection()
  const { getVmById } = useXoVmCollection()
  const { getNetworkById } = useXoNetworkCollection()

  return (rule: TrafficRule): TrafficRuleTarget => {
    if (rule.type === 'network') {
      const network = getNetworkById(rule.sourceId)

      return {
        label: network?.name_label ?? '',
        icon: 'object:network',
        to: network ? getPoolNetworkRoute(network.$pool, network.id) : undefined,
      }
    }

    const vif = getVifById(rule.sourceId)
    const vm = vif ? getVmById(vif.$VM) : undefined

    return {
      label: vif ? `${t('vif')}${vif.device}` : '',
      icon: 'object:vif',
      to: vif && vm ? { name: '/vm/[id]/networks', params: { id: vif.$VM } } : undefined,
      suffix: vm
        ? {
            label: vm.name_label,
            icon: `object:vm:${toLower(vm.power_state)}`,
            to: { name: '/vm/[id]/dashboard', params: { id: vm.id } },
          }
        : undefined,
    }
  }
}
