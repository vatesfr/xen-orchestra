import type { V2vMigratedVm } from '@/modules/v2v/composables/use-v2v-review-step.composable.ts'
import type {
  V2vLaunchPlanItem,
  V2vLaunchSettings,
  V2vStartVm,
  V2vVmLaunchOptionsRow,
} from '@/modules/v2v/types/v2v-launch.type.ts'
import type { V2vStartPayloadInput } from '@/modules/v2v/utils/v2v-start-payload.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import { V2V_VM_ID } from '@/test/create-v2v-inventory.ts'
import { createV2vDestinationDefaults } from '@/test/create-v2v-migration-list.ts'
import { stubFetchResponse } from '@/test/stub-fetch-response.ts'
import { V2V_SELECTED_VM_CHECK } from '@/test/v2v-selected-vm-checks.ts'
import type { XoTask } from '@vates/types'

// The settings a launch starts with
export function createV2vLaunchSettings(overrides: Partial<V2vLaunchSettings> = {}): V2vLaunchSettings {
  return { stopSource: true, stopOnError: true, concurrency: 2, ...overrides }
}

// A new VM, ready to launch
export function createV2vLaunchPlanItem(overrides: Partial<V2vLaunchPlanItem> = {}): V2vLaunchPlanItem {
  return { id: V2V_VM_ID, kind: 'new', check: V2V_SELECTED_VM_CHECK.ready, ...overrides }
}

// A new VM on the list defaults, without launch override
export function createV2vStartVm(overrides: Partial<V2vStartVm> = {}): V2vStartVm {
  return { id: V2V_VM_ID, kind: 'new', ...overrides }
}

// A VM of the per-VM launch options, on the launch settings
export function createV2vVmLaunchOptionsRow(overrides: Partial<V2vVmLaunchOptionsRow> = {}): V2vVmLaunchOptionsRow {
  return { id: V2V_VM_ID, name: 'web-01', ...overrides }
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

// A VM cut over to another pool, its second copy not confirmed
export function createV2vMigratedVm(overrides: Partial<V2vMigratedVm> = {}): V2vMigratedVm {
  return {
    id: V2V_VM_ID,
    name: 'web-01',
    importVm: { id: 'xo-vm-1' as FrontXoVm['id'], name: 'web-01 (imported)' },
    poolName: 'forcair',
    srs: 'sr-ssd-03',
    cutover: 'Cutover done on 10/2/2026.',
    isConfirmed: false,
    ...overrides,
  }
}

export const V2V_START_TASK_ID = 'task-1' as XoTask['id']

// The start route accepts the launch and answers its task
export function stubV2vStartAccepted() {
  return stubFetchResponse(202, { taskId: V2V_START_TASK_ID })
}

// The start route refuses the launch for these problems, each of one VM or of the whole launch
export function stubV2vStartProblems(errors: { vm?: string; message: string }[]) {
  return stubFetchResponse(422, { error: 'the migration cannot be started', data: { errors } })
}
