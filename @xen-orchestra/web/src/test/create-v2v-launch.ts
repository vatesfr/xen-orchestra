import type {
  V2vLaunchPlanItem,
  V2vLaunchSettings,
  V2vStartVm,
  V2vVmLaunchOptionsRow,
} from '@/modules/v2v/types/v2v-launch.type.ts'
import type { V2vStartPayloadInput } from '@/modules/v2v/utils/v2v-start-payload.util.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import { createV2vDestinationDefaults } from '@/test/create-v2v-migration-list.ts'
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

// A VM of the per-VM launch options, on the launch settings
export function createV2vVmLaunchOptionsRow(overrides: Partial<V2vVmLaunchOptionsRow> = {}): V2vVmLaunchOptionsRow {
  return { id: 'vm-1' as XoV2vVm['id'], name: 'web-01', ...overrides }
}

// The launch of one new VM, on the list defaults and the settings a launch starts with
export function createV2vStartPayloadInput(overrides: Partial<V2vStartPayloadInput> = {}): V2vStartPayloadInput {
  return {
    connection: createV2vConnection(),
    defaults: createV2vDestinationDefaults(),
    settings: createV2vLaunchSettings(),
    vms: [createV2vStartVm()],
    ...overrides,
  }
}
