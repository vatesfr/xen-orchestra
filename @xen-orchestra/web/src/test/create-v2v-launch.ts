import type { V2vLaunchPlanItem, V2vLaunchSettings, V2vStartVm } from '@/modules/v2v/types/v2v-launch.type.ts'
import { V2V_SELECTED_VM_CHECK } from '@/test/v2v-selected-vm-checks.ts'
import type { XoV2vVm } from '@vates/types'

// The settings a launch starts with
export function createV2vLaunchSettings(overrides: Partial<V2vLaunchSettings> = {}): V2vLaunchSettings {
  return { stopSource: true, stopOnError: true, concurrency: 2, ...overrides }
}

// A new VM, ready to launch
export function createV2vLaunchPlanItem(overrides: Partial<V2vLaunchPlanItem> = {}): V2vLaunchPlanItem {
  return { id: 'vm-1' as XoV2vVm['id'], kind: 'new', check: V2V_SELECTED_VM_CHECK.ready, ...overrides }
}

// A new VM on the list defaults, without launch override
export function createV2vStartVm(overrides: Partial<V2vStartVm> = {}): V2vStartVm {
  return { id: 'vm-1' as XoV2vVm['id'], kind: 'new', ...overrides }
}
