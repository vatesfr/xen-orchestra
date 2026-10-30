import type {
  V2vDestinationDefaults,
  V2vMigrationList,
  V2vMigrationListVm,
} from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { V2V_TEST_SOURCE, V2V_VM_ID } from '@/test/create-v2v-inventory.ts'
import type { XoV2vVm } from '@vates/types'

export function createV2vDestinationDefaults(overrides: Partial<V2vDestinationDefaults> = {}): V2vDestinationDefaults {
  return {
    sr: 'sr-123' as V2vDestinationDefaults['sr'],
    network: 'network-123' as V2vDestinationDefaults['network'],
    template: 'template-123' as V2vDestinationDefaults['template'],
    ...overrides,
  }
}

export function createV2vMigrationList(overrides: Partial<V2vMigrationList> = {}): V2vMigrationList {
  return {
    version: 1,
    sourceId: V2V_TEST_SOURCE.instanceUuid,
    poolId: 'pool-789' as V2vMigrationList['poolId'],
    defaults: createV2vDestinationDefaults(),
    vms: [],
    ...overrides,
  }
}

// What a newer XO would store: a version this one cannot read
export function createNewerV2vMigrationList(list = createV2vMigrationList()) {
  return { ...list, version: 2 }
}

export function createV2vMigrationListVm(overrides: Partial<V2vMigrationListVm> = {}): V2vMigrationListVm {
  return {
    id: V2V_VM_ID,
    ...overrides,
  }
}

export function createV2vMigrationListVmsOf(ids: XoV2vVm['id'][]): V2vMigrationList['vms'] {
  return ids.map(id => createV2vMigrationListVm({ id }))
}

export function createV2vMigrationListVms(count: number): V2vMigrationList['vms'] {
  return createV2vMigrationListVmsOf(Array.from({ length: count }, (_, index) => `vm-${index + 1}` as XoV2vVm['id']))
}
