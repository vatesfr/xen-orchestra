import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { ONE_GB } from '@/shared/constants.ts'
import { VM_POWER_STATE } from '@vates/types'

/**
 * Builds a fully-populated `FrontXoVmSnapshot` for use in tests. Pass
 * `overrides` to tweak only the fields relevant to the case under test.
 */
export function createVmSnapshot(overrides: Partial<FrontXoVmSnapshot> = {}): FrontXoVmSnapshot {
  return {
    id: 'snapshot-123' as FrontXoVmSnapshot['id'],
    $snapshot_of: 'vm-123' as FrontXoVmSnapshot['$snapshot_of'],
    name_label: 'Test snapshot',
    name_description: 'A test snapshot',
    snapshot_time: 1660000000,
    power_state: VM_POWER_STATE.HALTED,
    memory: {
      dynamic: [2 * ONE_GB, 4 * ONE_GB],
      size: 4 * ONE_GB,
      static: [2 * ONE_GB, 4 * ONE_GB],
    },
    parent: undefined,
    other: {},
    creation: {},
    $VBDs: [],
    ...overrides,
  }
}
