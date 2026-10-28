import type { V2vListLock, V2vSelectedVm } from '@/modules/v2v/composables/use-v2v-selected-vms.composable.ts'
import { DISKOR_POOL_NAME } from '@/test/create-pool.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import type { XoV2vVm } from '@vates/types'

// The labels are the component input: a panel test reads them back as given
export function createV2vSelectedVm(overrides: Partial<V2vSelectedVm> = {}): V2vSelectedVm {
  const id = overrides.id ?? ('vm-1' as XoV2vVm['id'])

  return {
    id,
    name: 'web-01',
    kind: { label: 'New', accent: 'neutral' },
    mappingParts: ['1 disk → sr-nvme-01', '1 NIC → VLAN 10'],
    check: { label: 'Ready', accent: 'success' },
    mappingRoute: { query: { step: 'mapping', vm: id } },
    isSelected: false,
    ...overrides,
  }
}

export function createV2vListLock(overrides: Partial<V2vListLock> = {}): V2vListLock {
  return { sourceHost: createV2vConnection().host, poolName: DISKOR_POOL_NAME, isLocked: true, ...overrides }
}
