import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { VM_POWER_STATE } from '@vates/types'

/**
 * Builds a fully-populated `FrontXoVmSnapshot` for use in tests. Pass
 * `overrides` to tweak only the fields relevant to the case under test.
 */
export function createVmSnapshot(overrides: Partial<FrontXoVmSnapshot> = {}): FrontXoVmSnapshot {
  return {
    id: 'snapshot-123',
    $snapshot_of: 'vm-123',
    name_label: 'Test snapshot',
    name_description: 'A test snapshot',
    snapshot_time: 1660000000,
    power_state: VM_POWER_STATE.HALTED,
    memory: {
      dynamic: [2147483648, 4294967296],
      size: 4294967296,
      static: [2147483648, 4294967296],
    },
    parent: undefined,
    other: {},
    creation: {},
    $VBDs: [],
    ...overrides,
  } as FrontXoVmSnapshot
}
