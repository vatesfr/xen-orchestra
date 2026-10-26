import { useVdfVmTagJob } from '@/modules/vdf/jobs/vdf-vm-tag.job.ts'
import { VDF_QUARANTINE_TAG, type VdfDocument, type VdfGroup } from '@/modules/vdf/types.ts'
import { displayName } from '@/modules/vdf/utils/vdf-global.util.ts'
import { isMonitored } from '@/modules/vdf/utils/vdf-monitor.util.ts'
import { groupUsage, isVmInGroup, tierValue, vmGroupNames } from '@/modules/vdf/utils/vdf-policy.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'

// The tags to remove for a VM to leave a group: those of the group no
// other group of the VM needs, so it stays where it is. When every tag is
// shared, the one that takes it out of the fewest other groups (named in
// `alsoLeaves`).
export function tagsToLeaveGroup(vmTags: string[], groupName: string, groups: Record<string, VdfGroup>) {
  const groupTags = (groups[groupName]?.tags ?? []).filter(tag => vmTags.includes(tag) && tag !== VDF_QUARANTINE_TAG)

  const otherGroups = Object.entries(groups).filter(([name, group]) => name !== groupName && isVmInGroup(vmTags, group))

  const groupsUsing = (tag: string) =>
    otherGroups.filter(([, group]) => group.tags?.includes(tag)).map(([name]) => name)

  const unshared = groupTags.filter(tag => groupsUsing(tag).length === 0)

  if (unshared.length > 0 || groupTags.length === 0) {
    return { tags: unshared, alsoLeaves: [] as string[] }
  }

  const [tag] = [...groupTags].sort((tagA, tagB) => groupsUsing(tagA).length - groupsUsing(tagB).length)

  return { tags: [tag], alsoLeaves: groupsUsing(tag) }
}

// Membership is tags: these edits are live (no draft), agents follow XAPI's
// events and re-apply within tens of milliseconds.
export function useVdfMembership() {
  const vms = ref<FrontXoVm[]>([])

  const tag = ref<string>()

  const present = ref(true)

  const { run, isRunning: isUpdatingTags } = useVdfVmTagJob(vms, tag, present)

  // why the last tag write failed, until the next one
  const tagError = ref<string>()

  // throws when a write fails (and keeps the reason in `tagError`)
  async function setTags(targets: FrontXoVm[], tags: string[], shouldBePresent: boolean) {
    vms.value = targets
    present.value = shouldBePresent
    tagError.value = undefined

    try {
      for (const value of tags) {
        tag.value = value
        await run()
      }
    } catch (error) {
      tagError.value = error instanceof Error ? error.message : String(error)

      throw error
    }
  }

  // for the actions below: the failure shows through `tagError`
  async function trySetTags(targets: FrontXoVm[], tags: string[], shouldBePresent: boolean) {
    try {
      await setTags(targets, tags, shouldBePresent)

      return true
    } catch {
      return false
    }
  }

  const { open: openAddVms } = useOverlay({
    component: () => import('@/modules/vdf/components/VdfAddVmsModal.vue'),
    events: {
      onConfirm: async (selected: FrontXoVm[]) => (selected.length === 0 ? KEEP_OVERLAY_OPEN : selected),
      onCancel: true,
    },
  })

  // `isPublished`: whether hosts know the group yet (if not, the tags are
  // written all the same, and only matter once it's published). `context`:
  // a pool's document (its draft) and the group's name in it, to tell
  // which monitored policies an enforced one decides first for (vdf#86)
  async function addVmsToGroup(
    name: string,
    group: VdfGroup,
    poolVms: FrontXoVm[],
    isPublished = true,
    context?: { name: string; document: VdfDocument }
  ) {
    const tags = group.tags ?? []
    const response = await openAddVms({
      props: {
        group: name,
        tags,
        candidates: poolVms.filter(vm => !isVmInGroup(vm.tags, group)),
        isPublished,
        groupName: context?.name,
        document: context?.document,
      },
    })

    return response.event === 'onConfirm' ? trySetTags(response.payload, tags, true) : false
  }

  const { open: openRemove } = useOverlay({
    component: () => import('@/modules/vdf/components/groups/VdfRemoveFromGroupModal.vue'),
    events: {
      onConfirm: true,
      onCancel: true,
    },
  })

  // A VM leaves a group when it loses one of the group's tags. Given the
  // scope's published document (and the group's name in it), only the tags
  // no other group of the VM needs are removed, and the confirmation says
  // which policies stop applying to it.
  async function removeVmFromGroup(vm: FrontXoVm, group: VdfGroup, context?: { name: string; document: VdfDocument }) {
    const name = context?.name ?? ''
    const { tags, alsoLeaves } = tagsToLeaveGroup(vm.tags, name, context?.document.groups ?? { [name]: group })

    if (tags.length === 0) {
      return true
    }

    const usage = context === undefined ? undefined : groupUsage(context.document, name)

    // whether a policy still protects the VM once it has left
    const remainingGroups = new Set(
      context === undefined
        ? []
        : vmGroupNames(
            vm.tags.filter(vmTag => !tags.includes(vmTag)),
            context.document
          )
    )

    // a policy of the same tier still applying, that drops by default,
    // then decides what the policies it leaves allowed (vdf#86); in monitor
    // mode, once enforced (its report couldn't see that traffic until now)
    const leaving = new Set([name, ...alsoLeaves])
    const lost = (context?.document.policies ?? []).filter(
      policy => !isMonitored(policy) && leaving.has(policy.appliedTo) && !remainingGroups.has(policy.appliedTo)
    )
    const takesOver = (context?.document.policies ?? [])
      .filter(policy => remainingGroups.has(policy.appliedTo) && policy.default === 'drop')
      .map(policy => ({
        policy: displayName(policy.name),
        monitored: isMonitored(policy),
        instead: lost
          .filter(other => tierValue(other.tier) === tierValue(policy.tier))
          .map(other => displayName(other.name)),
      }))
      .filter(item => item.instead.length > 0)

    const response = await openRemove({
      props: {
        takesOver,
        vmName: vm.name_label,
        groupName: context === undefined ? undefined : displayName(name),
        tags,
        alsoLeaves: alsoLeaves.map(displayName),
        protectedBy: (usage?.appliedTo ?? []).map(displayName),
        sourceIn: (usage?.sourceOf ?? []).map(displayName),
        losesProtection:
          (usage?.appliedTo.length ?? 0) > 0 &&
          !context!.document.policies.some(policy => remainingGroups.has(policy.appliedTo)),
      },
    })

    return response.event === 'onConfirm' ? trySetTags([vm], tags, false) : false
  }

  function setQuarantine(vm: FrontXoVm, quarantined: boolean) {
    return setTags([vm], [VDF_QUARANTINE_TAG], quarantined)
  }

  return { setTags, addVmsToGroup, removeVmFromGroup, setQuarantine, isUpdatingTags, tagError }
}
