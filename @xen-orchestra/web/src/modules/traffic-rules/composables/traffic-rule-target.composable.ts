import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getPoolNetworkRoute } from '@/modules/network/utils/xo-network.util.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useXoVmOperationLabel } from '@/modules/vm/composables/xo-vm-operation-label.composable.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { getVmIcon } from '@/modules/vm/utils/xo-vm.util.ts'
import type { LinkOptions } from '@core/composables/link-component.composable.ts'
import type { IconName } from '@core/icons'
import type { TrafficRule } from '@vates/types'
import { useI18n } from 'vue-i18n'

type TrafficRuleTargetEntry = {
  label: string
  icon: IconName
  iconTooltip?: string
  to: LinkOptions['to']
  disabled?: boolean
}

export type TrafficRuleTarget = TrafficRuleTargetEntry & {
  suffix?: TrafficRuleTargetEntry
}

export function useTrafficRuleTarget() {
  const { t } = useI18n()
  const { getVifById } = useXoVifCollection()
  const { getVmById } = useXoVmCollection()
  const { getNetworkById } = useXoNetworkCollection()
  const { getVmIconTooltip } = useXoVmOperationLabel()

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
      to: vif ? { name: '/vif/[id]/general', params: { id: vif.id } } : undefined,
      disabled: !vm,
      suffix: vm
        ? {
            label: vm.name_label,
            icon: getVmIcon(vm),
            iconTooltip: getVmIconTooltip(vm),
            to: { name: '/vm/[id]/dashboard', params: { id: vm.id } },
          }
        : undefined,
    }
  }
}
