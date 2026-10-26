import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useTrafficRules } from '@/modules/traffic-rules/composables/traffic-rules.composable.ts'
import type { VdfShadowedVif } from '@/modules/vdf/types.ts'
import { trafficRuleStatus } from '@/modules/vdf/utils/vdf-traffic-rules.util.ts'
import { type FrontXoVif, useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { TrafficRule } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export type VdfVmTrafficRule = { rule: TrafficRule; vif: FrontXoVif }

// XO's Traffic Rules that apply to a VM (vdf#40): those of its interfaces,
// and those of their networks (every interface on it), as XO 6's Traffic
// rules pages read them
export function useVdfTrafficRules() {
  const { t } = useI18n()

  const { vifs } = useXoVifCollection()

  const { networks, getNetworkById } = useXoNetworkCollection()

  const { trafficRules } = useTrafficRules(vifs, networks)

  const bySource = computed(() => {
    const result = new Map<string, TrafficRule[]>()

    for (const rule of trafficRules.value) {
      result.set(rule.sourceId, [...(result.get(rule.sourceId) ?? []), rule])
    }

    return result
  })

  const vifsByVm = computed(() => {
    const result = new Map<string, FrontXoVif[]>()

    for (const vif of vifs.value) {
      result.set(vif.$VM, [...(result.get(vif.$VM) ?? []), vif])
    }

    return result
  })

  function rulesOfVm(vm: FrontXoVm): VdfVmTrafficRule[] {
    return (vifsByVm.value.get(vm.id) ?? []).flatMap(vif =>
      [...(bySource.value.get(vif.id) ?? []), ...(bySource.value.get(vif.$network) ?? [])].map(rule => ({ rule, vif }))
    )
  }

  // "Allow TCP 22 from 10.0.0.0/8 · eth0", or "· network Prod" for a rule of the network
  function ruleText({ rule, vif }: VdfVmTrafficRule) {
    return t('firewall:traffic-rule', {
      action: rule.allow ? t('firewall:action:allow') : t('firewall:action:drop'),
      protocol: rule.protocol,
      port: rule.port ? ` ${rule.port}` : '',
      direction: t(`firewall:traffic-rule:${rule.direction === 'from/to' ? 'both' : rule.direction}`, {
        range: rule.ipRange || t('firewall:traffic-rule:anywhere'),
      }),
      where:
        rule.type === 'network'
          ? t('firewall:traffic-rule:network', { network: getNetworkById(vif.$network)?.name_label ?? '?' })
          : t('firewall:traffic-rule:vif', { device: vif.device }),
    })
  }

  const statusOf = ({ rule, vif }: VdfVmTrafficRule, shadowed: Map<string, VdfShadowedVif>) =>
    trafficRuleStatus(rule, shadowed.get(vif.id))

  return { rulesOfVm, ruleText, statusOf }
}
