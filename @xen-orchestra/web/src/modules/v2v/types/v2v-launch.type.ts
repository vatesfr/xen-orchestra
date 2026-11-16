import type { V2vMigrationListVm } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import type { V2vSelectedVmState } from '@/modules/v2v/types/v2v-selected-vm.type.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { XoV2vStartOptions, XoV2vStartPayload, XoV2vVm } from '@vates/types'
import type { RouteLocationRaw } from 'vue-router'

// What the user sets for the whole launch: starting the VM and cleaning it up are not supported yet
export type V2vLaunchSettings = Pick<XoV2vStartOptions, 'stopSource'> &
  Pick<XoV2vStartPayload, 'stopOnError' | 'concurrency'>

export type V2vLaunchGroupType = 'excluded' | 'migrated' | 'resumed' | 'new'

export type V2vLaunchPlanItem = V2vSelectedVmState & { id: XoV2vVm['id'] }

export type V2vLaunchableVm = Pick<V2vLaunchPlanItem, 'id' | 'kind'> & Pick<XoV2vVm, 'name'>

export type V2vLaunchPlan<TItem extends V2vLaunchPlanItem> = Record<V2vLaunchGroupType, TItem[]> & {
  launchable: TItem[]
}

// An absent override leaves the VM on the launch settings
export type V2vVmLaunchOverrides = Partial<Pick<XoV2vStartOptions, 'stopSource'>>

export type V2vStartVm = Pick<V2vMigrationListVm, 'id' | 'disks' | 'nics' | 'template'> &
  Pick<V2vSelectedVmState, 'kind'> & { overrides?: V2vVmLaunchOverrides }

// A row of the per-VM launch options table: an absent override follows the launch settings
export type V2vVmLaunchOptionsRow = Pick<XoV2vVm, 'id' | 'name'> & Pick<V2vStartVm, 'overrides'>

// A problem the back end refused the launch for, of one VM or of the whole launch
export type V2vStartProblem = {
  vmId?: XoV2vVm['id']
  message: string
}

// A refused launch tells every problem at once, so the user fixes them all before launching again
export type V2vLaunchError = { title: string; messages: string[] }

export type V2vLaunched = {
  count: number
  taskRoute: RouteLocationRaw
}

export type V2vExcludedVm = {
  id: XoV2vVm['id']
  name: string
  route: RouteLocationRaw
  reason: string
}

export type V2vMigratedVm = {
  id: XoV2vVm['id']
  name: string
  importVm: { id: FrontXoVm['id']; name: string }
  poolName: string
  srNames: string
  cutoverLabel?: string
  isConfirmed: boolean
}

export type V2vResumedVm = {
  id: XoV2vVm['id']
  name: string
  parts: string[]
}
