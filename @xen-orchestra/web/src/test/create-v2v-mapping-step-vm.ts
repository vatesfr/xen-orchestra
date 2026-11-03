import type {
  V2vNewMappingStepVm,
  V2vNotFoundMappingStepVm,
  V2vResumedMappingStepVm,
} from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import { createV2vMappingVmHeading } from '@/test/create-v2v-mapping-vm-heading.ts'
import { createV2vMigrationList, createV2vMigrationListVm } from '@/test/create-v2v-migration-list.ts'
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
