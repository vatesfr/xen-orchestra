import { useVdfInterfaces } from '@/modules/vdf/composables/vdf-interfaces.composable.ts'
import { isUnlocked } from '@/modules/vdf/composables/vdf-lock.composable.ts'
import { useVdfGlobal } from '@/modules/vdf/remote-resources/use-vdf-global.ts'
import type { VdfDocument, VdfPolicy } from '@/modules/vdf/types.ts'
import { displayName, isGlobalName } from '@/modules/vdf/utils/vdf-global.util.ts'
import { untrustedInPolicy } from '@/modules/vdf/utils/vdf-locking.util.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { VM_POWER_STATE } from '@vates/types'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

// Members whose addresses the firewall can't trust (vdf#41): running VMs
// of the pool with an interface in the group their guest may use any
// address on (unlocked: XAPI can't lock it while an SDN controller is
// registered, or nobody did; on a vdf:unprotected network too, whose
// addresses count in groups all the same, as for agents), and, for a
// global group, its members in other pools whose IPs come from their
// guests. A guest can then claim
// another VM's address, and drops against it on other hosts are best
// effort.
export function useVdfUntrustedMembers(
  rawPoolId: MaybeRefOrGetter<string>,
  rawDocument: MaybeRefOrGetter<VdfDocument>
) {
  const { vms } = useXoVmCollection()

  const { groupInterfaces, interfacesOf } = useVdfInterfaces()

  const { globalStatus } = useVdfGlobal()

  const runningVms = computed(() =>
    vms.value.filter(vm => vm.$pool === toValue(rawPoolId) && vm.power_state === VM_POWER_STATE.RUNNING)
  )

  // an interface of the VM the firewall protects whose guest may use any
  // address
  const isVmUntrusted = (vm: FrontXoVm) => interfacesOf(vm).some(iface => isUnlocked(iface.vif, iface.network))

  const byGroup = computed(() => {
    const poolId = toValue(rawPoolId)
    const result = new Map<string, string[]>()

    for (const [name, group] of Object.entries(toValue(rawDocument).groups)) {
      const local = runningVms.value
        .filter(vm => groupInterfaces(vm, group).some(iface => isUnlocked(iface.vif, iface.network)))
        .map(vm => vm.name_label)
      const remote = isGlobalName(name)
        ? (globalStatus.value?.members[displayName(name)] ?? [])
            .filter(member => member.pool !== poolId && !member.trusted)
            .map(member => (member.poolName === undefined ? member.vmName : `${member.vmName} (${member.poolName})`))
        : []

      result.set(name, [...local, ...remote])
    }

    return result
  })

  const untrustedOf = (group: string) => byGroup.value.get(group) ?? []

  // a policy's: its own VMs and its rules' peers, or only the peers
  const untrustedInPolicyOf = (policy: VdfPolicy, options?: { peersOnly?: boolean }) =>
    untrustedInPolicy(policy, untrustedOf, options)

  return { untrustedOf, untrustedInPolicy: untrustedInPolicyOf, isVmUntrusted }
}
