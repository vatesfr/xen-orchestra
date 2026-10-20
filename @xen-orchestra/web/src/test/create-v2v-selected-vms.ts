import type { V2vListLock, V2vSelectedVmItem } from '@/modules/v2v/composables/use-v2v-selected-vms.composable.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import type { XoV2vVm } from '@vates/types'

// The labels are the component input: a panel test reads them back as given
export function createV2vSelectedVmItem(overrides: Partial<V2vSelectedVmItem> = {}): V2vSelectedVmItem {
  const id = overrides.id ?? ('vm-1' as XoV2vVm['id'])

  return {
    id,
    name: 'web-01',
    kind: { label: 'New', accent: 'neutral' },
    mappingParts: ['1 disk → sr-nvme-01', '1 NIC → VLAN 10'],
    check: { label: 'Ready', accent: 'success' },
    mappingRoute: { query: { step: 'mapping', vm: id } },
    ...overrides,
  }
}

export function createV2vListLock(overrides: Partial<V2vListLock> = {}): V2vListLock {
  return { sourceHost: createV2vConnection().host, poolName: 'pool diskor', isLocked: true, ...overrides }
}
