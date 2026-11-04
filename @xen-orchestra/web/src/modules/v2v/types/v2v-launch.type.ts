import type { V2vMigrationListVm } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import type { V2vSelectedVmState } from '@/modules/v2v/types/v2v-selected-vm.type.ts'
import type { XoV2vStartOptions, XoV2vStartPayload, XoV2vVm } from '@vates/types'

// What the user sets for the whole launch: cleaning the VM up is not supported yet, and the repair takes the
// defaults of the back end
export type V2vLaunchSettings = Pick<XoV2vStartOptions, 'stopSource' | 'startVm'> & {
  repair: boolean
} & Pick<XoV2vStartPayload, 'stopOnError' | 'concurrency'>

export type V2vVmLaunchOption = 'stopSource' | 'repair' | 'startVm'

export type V2vLaunchGroupType = 'excluded' | 'migrated' | 'resumed' | 'new'

export type V2vLaunchPlanItem = V2vSelectedVmState & { id: XoV2vVm['id'] }

export type V2vLaunchPlan<TItem extends V2vLaunchPlanItem> = Record<V2vLaunchGroupType, TItem[]> & {
  launchable: TItem[]
}

// An absent override leaves the VM on the launch settings
export type V2vVmLaunchOverrides = Partial<Pick<V2vLaunchSettings, V2vVmLaunchOption>>

export type V2vStartVm = Pick<V2vMigrationListVm, 'id' | 'disks' | 'nics' | 'template'> &
  Pick<V2vSelectedVmState, 'kind'> & { overrides?: V2vVmLaunchOverrides }

// A row of the per-VM launch options table: an absent override follows the launch settings
export type V2vVmLaunchOptionsRow = Pick<XoV2vVm, 'id' | 'name'> & Pick<V2vStartVm, 'overrides'>

// A problem the back end refused the launch for, of one VM or of the whole launch
export type V2vStartProblem = {
  vmId?: XoV2vVm['id']
  message: string
}
