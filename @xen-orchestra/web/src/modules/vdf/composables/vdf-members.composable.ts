import type { VdfDocument } from '@/modules/vdf/types.ts'
import { VDF_QUARANTINE_TAG } from '@/modules/vdf/types.ts'
import { isVmInGroup } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { VM_POWER_STATE } from '@vates/types'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

// Group members as the agents resolve them: VMs carrying all the group's
// tags. Protection (appliedTo) follows the tags whatever the power state;
// as a rule source, only running VMs' IPs count.
export function useVdfMembers(rawPoolId: MaybeRefOrGetter<string>, rawDocument: MaybeRefOrGetter<VdfDocument>) {
  const { vms, areVmsReady } = useXoVmCollection()

  const poolVms = computed(() => vms.value.filter(vm => vm.$pool === toValue(rawPoolId)))

  const membersByGroup = computed(() => {
    const members = new Map<string, FrontXoVm[]>()

    for (const [name, group] of Object.entries(toValue(rawDocument).groups)) {
      members.set(
        name,
        poolVms.value.filter(vm => isVmInGroup(vm.tags, group))
      )
    }

    return members
  })

  function membersOf(groupName: string) {
    return membersByGroup.value.get(groupName) ?? []
  }

  const protectedVms = computed(() => {
    const appliedTo = new Set(toValue(rawDocument).policies.map(policy => policy.appliedTo))

    return poolVms.value.filter(vm => [...appliedTo].some(name => membersOf(name).includes(vm)))
  })

  const quarantinedVms = computed(() => poolVms.value.filter(vm => vm.tags.includes(VDF_QUARANTINE_TAG)))

  const runningVms = computed(() => poolVms.value.filter(vm => vm.power_state === VM_POWER_STATE.RUNNING))

  return { poolVms, runningVms, membersOf, protectedVms, quarantinedVms, areVmsReady }
}
