import { useVdfInterfaces } from '@/modules/vdf/composables/vdf-interfaces.composable.ts'
import { useVdfTierLabel } from '@/modules/vdf/composables/vdf-tier-label.composable.ts'
import type { VdfDocument } from '@/modules/vdf/types.ts'
import { displayName } from '@/modules/vdf/utils/vdf-global.util.ts'
import { groupNetworks, isOnNetworks } from '@/modules/vdf/utils/vdf-networks.util.ts'
import { vmGroupNames } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { monitorShadows, type VdfInterfaceGroups, type VdfMonitorShadow } from '@/modules/vdf/utils/vdf-shadow.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useI18n } from 'vue-i18n'

// at most this many VMs named in a sentence, then "and N more"
const NAMED_VMS = 4

// Where a monitored policy can't see what it would drop, because an
// enforced policy decides first for some of its VMs (vdf#86), from a
// document and the VMs it applies to, and the sentences that say so
export function useVdfMonitorShadows() {
  const { t, n, locale } = useI18n()

  const { interfacesOf } = useVdfInterfaces()

  const tierLabel = useVdfTierLabel()

  // a VM's protected interfaces with the groups selecting each; `tags`: the
  // tags it will have (joining a group)
  function interfaceGroups(vm: FrontXoVm, document: VdfDocument, tags = vm.tags): VdfInterfaceGroups[] {
    const groups = vmGroupNames(tags, document)

    if (groups.length === 0) {
      return []
    }

    return interfacesOf(vm)
      .filter(iface => !iface.unprotected)
      .map(iface => ({
        vm: vm.id,
        vmName: vm.name_label,
        groups: groups.filter(name => isOnNetworks(iface.netTags, groupNetworks(document.groups[name]))),
      }))
  }

  // vms: each VM, and the tags it has (or will have)
  function shadowsIn(document: VdfDocument, vms: { vm: FrontXoVm; tags?: string[] }[]): VdfMonitorShadow[] {
    return monitorShadows(
      document,
      vms.flatMap(({ vm, tags }) => interfaceGroups(vm, document, tags))
    )
  }

  function vmList(shadow: VdfMonitorShadow) {
    const names = shadow.vms.map(vm => vm.name).sort((a, b) => a.localeCompare(b))
    const shown = names.length > NAMED_VMS + 1 ? names.slice(0, NAMED_VMS) : names
    const rest = names.length - shown.length

    return new Intl.ListFormat(locale.value, { type: 'conjunction' }).format(
      rest > 0 ? [...shown, t('firewall:monitor:shadow:more-vms', { n: n(rest) }, rest)] : shown
    )
  }

  // why the report shows nothing the policy would drop on these VMs
  function shadowText(shadow: VdfMonitorShadow) {
    const params = {
      policy: displayName(shadow.policy),
      by: displayName(shadow.by),
      state: shadow.byMonitored ? t('firewall:monitor:shadow:monitored') : t('firewall:monitor:shadow:enforced'),
      tier: tierLabel(shadow.tier),
      vms: vmList(shadow),
      n: shadow.vms.length,
    }

    const key = `firewall:monitor:shadow:${shadow.sameTier ? 'same-tier' : 'earlier-tier'}${shadow.kind === 'rules' ? '-rules' : ''}`

    return t(key, params, shadow.vms.length)
  }

  // a same-tier shadow the hosts' agents cover (vdf#86): the report has what
  // the policy alone would drop there, in its own section
  function coveredShadowText(shadow: VdfMonitorShadow) {
    return t(
      'firewall:monitor:shadow:covered',
      { policy: displayName(shadow.policy), by: displayName(shadow.by), vms: vmList(shadow), n: shadow.vms.length },
      shadow.vms.length
    )
  }

  return { interfaceGroups, shadowsIn, shadowText, coveredShadowText }
}
