import type {
  V2vDestinationDefaults,
  V2vMigrationList,
  V2vMigrationListVm,
} from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { V2V_TEST_SOURCE } from '@/test/create-v2v-inventory.ts'
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

export function createV2vMigrationListVm(overrides: Partial<V2vMigrationListVm> = {}): V2vMigrationListVm {
  return {
    id: 'vm-1' as XoV2vVm['id'],
    ...overrides,
  }
}

export function createV2vMigrationListVms(count: number): V2vMigrationList['vms'] {
  return Array.from({ length: count }, (_, index) =>
    createV2vMigrationListVm({ id: `vm-${index + 1}` as XoV2vVm['id'] })
  )
}
