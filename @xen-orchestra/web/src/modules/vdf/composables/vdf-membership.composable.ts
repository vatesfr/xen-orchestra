import { useVdfVmTagJob } from '@/modules/vdf/jobs/vdf-vm-tag.job.ts'
import { VDF_QUARANTINE_TAG, type VdfGroup } from '@/modules/vdf/types.ts'
import { isVmInGroup } from '@/modules/vdf/utils/vdf-policy.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'

// Membership is tags: these edits are live (no draft), agents follow XAPI's
// events and re-apply within tens of milliseconds.
export function useVdfMembership() {
  const vms = ref<FrontXoVm[]>([])

  const tag = ref<string>()

  const present = ref(true)

  const { run, isRunning: isUpdatingTags } = useVdfVmTagJob(vms, tag, present)

  async function setTags(targets: FrontXoVm[], tags: string[], shouldBePresent: boolean) {
    vms.value = targets
    present.value = shouldBePresent

    for (const value of tags) {
      tag.value = value
      await run()
    }
  }

  const { open: openAddVms } = useOverlay({
    component: () => import('@/modules/vdf/components/VdfAddVmsModal.vue'),
    events: {
      onConfirm: async (selected: FrontXoVm[]) => selected,
      onCancel: true,
    },
  })

  async function addVmsToGroup(name: string, group: VdfGroup, poolVms: FrontXoVm[]) {
    const tags = group.tags ?? []
    const response = await openAddVms({
      props: { group: name, tags, candidates: poolVms.filter(vm => !isVmInGroup(vm.tags, group)) },
    })

    if (response.event === 'onConfirm') {
      await setTags(response.payload, tags, true)
    }
  }

  // a VM leaves the group when it loses one of the group's tags: all of
  // them are removed, so it doesn't stay half-tagged
  function removeVmFromGroup(vm: FrontXoVm, group: VdfGroup) {
    return setTags([vm], group.tags ?? [], false)
  }

  function setQuarantine(vm: FrontXoVm, quarantined: boolean) {
    return setTags([vm], [VDF_QUARANTINE_TAG], quarantined)
  }

  return { setTags, addVmsToGroup, removeVmFromGroup, setQuarantine, isUpdatingTags }
}
