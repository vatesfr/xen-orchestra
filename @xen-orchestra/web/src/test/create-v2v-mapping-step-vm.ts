import type {
  V2vMappingStepRow,
  V2vMappingStepVm,
  V2vNewMappingStepVm,
  V2vNotFoundMappingStepVm,
  V2vResumedMappingStepVm,
} from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import type { V2vSelectedVm } from '@/modules/v2v/composables/use-v2v-selected-vms.composable.ts'
import { createV2vMappingVmHeading } from '@/test/create-v2v-mapping-vm-heading.ts'
import { createV2vMigrationList, createV2vMigrationListVm } from '@/test/create-v2v-migration-list.ts'
import { createV2vSelectedVm } from '@/test/create-v2v-selected-vms.ts'
import { V2V_MAPPED_VM, V2V_RESUMED_IMPORT_VM, V2V_SYNCED_VM } from '@/test/v2v-mapping-fixtures.ts'
import { V2V_GONE_VM_ID } from '@/test/v2v-mapping-step-fixtures.ts'

// The VM of a mapping step, one per kind: the mapped VM, new in its list or resumed from its import, or a VM gone from
// the source
export function createV2vNewMappingStepVm(overrides: Partial<V2vNewMappingStepVm> = {}): V2vNewMappingStepVm {
  return {
    kind: 'new',
    id: V2V_MAPPED_VM.id,
    heading: createV2vMappingVmHeading({ name: V2V_MAPPED_VM.name }),
    vm: V2V_MAPPED_VM,
    list: createV2vMigrationList({ vms: [createV2vMigrationListVm({ id: V2V_MAPPED_VM.id })] }),
    ...overrides,
  }
}

export function createV2vResumedMappingStepVm(
  overrides: Partial<V2vResumedMappingStepVm> = {}
): V2vResumedMappingStepVm {
  return {
    kind: 'resume',
    id: V2V_SYNCED_VM.id,
    heading: createV2vMappingVmHeading({ name: V2V_SYNCED_VM.name }),
    vm: V2V_SYNCED_VM,
    importVm: V2V_RESUMED_IMPORT_VM,
    lastSyncAt: Date.UTC(2026, 9, 2, 14, 40),
    ...overrides,
  }
}

export function createV2vNotFoundMappingStepVm(
  overrides: Partial<V2vNotFoundMappingStepVm> = {}
): V2vNotFoundMappingStepVm {
  return {
    kind: 'not-found',
    id: V2V_GONE_VM_ID,
    // The step tells only the source host of a VM it no longer finds, and no status
    heading: createV2vMappingVmHeading({
      name: 'legacy-01',
      locationParts: ['vcenter-prod.lab.local'],
      statusTag: undefined,
    }),
    ...overrides,
  }
}

// One mapping step VM of each kind, as created by default
export const V2V_NEW_STEP_VM = createV2vNewMappingStepVm()

export const V2V_RESUMED_STEP_VM = createV2vResumedMappingStepVm()

export const V2V_NOT_FOUND_STEP_VM = createV2vNotFoundMappingStepVm()

// A row of the mapping table: the VM, its item of the selected VMs named after it
export function createV2vMappingStepRow(
  vm: V2vMappingStepVm,
  itemOverrides: Partial<V2vSelectedVm> = {}
): V2vMappingStepRow {
  return { vm, item: createV2vSelectedVm({ id: vm.id, name: vm.heading.name, ...itemOverrides }) }
}
