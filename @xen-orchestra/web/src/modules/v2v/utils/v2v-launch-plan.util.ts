import type { V2vLaunchGroupType, V2vLaunchPlan, V2vLaunchPlanItem } from '@/modules/v2v/types/v2v-launch.type.ts'
import type { V2vSelectedVmState } from '@/modules/v2v/types/v2v-selected-vm.type.ts'
import type { XoV2vVm } from '@vates/types'

// The same checks as the selected VMs panel: a VM it shows blocked is never launched
export function getV2vLaunchGroupType({ kind, check }: V2vSelectedVmState): V2vLaunchGroupType {
  if (check.level === 'blocking') {
    return 'excluded'
  }

  if (check.type === 'already-migrated') {
    return 'migrated'
  }

  return kind === 'resume' ? 'resumed' : 'new'
}

// An already migrated VM is imported again as a second VM: only once the user confirms it
export function getV2vLaunchPlan<TItem extends V2vLaunchPlanItem>(
  items: TItem[],
  confirmedIds: ReadonlySet<XoV2vVm['id']>
): V2vLaunchPlan<TItem> {
  const plan: V2vLaunchPlan<TItem> = { excluded: [], migrated: [], resumed: [], new: [], launchable: [] }

  for (const item of items) {
    const groupType = getV2vLaunchGroupType(item)

    plan[groupType].push(item)

    const isLaunchable = groupType !== 'excluded' && (groupType !== 'migrated' || confirmedIds.has(item.id))

    if (isLaunchable) {
      plan.launchable.push(item)
    }
  }

  return plan
}
