import { useVdfInterfaces } from '@/modules/vdf/composables/vdf-interfaces.composable.ts'
import type { VdfDocument } from '@/modules/vdf/types.ts'
import { VDF_QUARANTINE_TAG } from '@/modules/vdf/types.ts'
import { enforcedPolicies, isMonitored } from '@/modules/vdf/utils/vdf-monitor.util.ts'
import { groupNetworks, isNetworksOnly } from '@/modules/vdf/utils/vdf-networks.util.ts'
import { isVmInGroup } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { VM_POWER_STATE } from '@vates/types'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

// Group members as the agents resolve them: VMs carrying all the group's
// tags, with an interface on its networks when it has some (vdf#36).
// Protection (appliedTo) follows the tags whatever the power state;
// as a rule source, only running VMs' IPs count. For the global
// configuration, the VMs of every pool in scope.
export function useVdfMembers(
  rawPoolIds: MaybeRefOrGetter<string | string[]>,
  rawDocument: MaybeRefOrGetter<VdfDocument>
) {
  const { vms, areVmsReady } = useXoVmCollection()

  const { groupInterfaces } = useVdfInterfaces()

  const poolVms = computed(() => {
    const poolIds = toValue(rawPoolIds)
    const ids = new Set(Array.isArray(poolIds) ? poolIds : [poolIds])

    return vms.value.filter(vm => ids.has(vm.$pool))
  })

  const membersByGroup = computed(() => {
    const members = new Map<string, FrontXoVm[]>()

    for (const [name, group] of Object.entries(toValue(rawDocument).groups)) {
      members.set(
        name,
        // a group on networks alone (vdf#98): the VMs with an interface on them
        poolVms.value.filter(vm =>
          isNetworksOnly(group)
            ? groupInterfaces(vm, group).length > 0
            : isVmInGroup(vm.tags, group) &&
              (groupNetworks(group).length === 0 || groupInterfaces(vm, group).length > 0)
        )
      )
    }

    return members
  })

  function membersOf(groupName: string) {
    return membersByGroup.value.get(groupName) ?? []
  }

  // what an enforced policy applies to (monitored ones protect nothing)
  const protectedVms = computed(() => {
    const appliedTo = new Set(enforcedPolicies(toValue(rawDocument)).map(policy => policy.appliedTo))

    return poolVms.value.filter(vm => [...appliedTo].some(name => membersOf(name).includes(vm)))
  })

  // only observed by policies in monitor mode, not protected (vdf#13)
  const monitoredVms = computed(() => {
    const appliedTo = new Set(
      toValue(rawDocument)
        .policies.filter(isMonitored)
        .map(policy => policy.appliedTo)
    )

    return poolVms.value.filter(
      vm => !protectedVms.value.includes(vm) && [...appliedTo].some(name => membersOf(name).includes(vm))
    )
  })

  const quarantinedVms = computed(() => poolVms.value.filter(vm => vm.tags.includes(VDF_QUARANTINE_TAG)))

  const runningVms = computed(() => poolVms.value.filter(vm => vm.power_state === VM_POWER_STATE.RUNNING))

  return { poolVms, runningVms, membersOf, protectedVms, monitoredVms, quarantinedVms, areVmsReady }
}
