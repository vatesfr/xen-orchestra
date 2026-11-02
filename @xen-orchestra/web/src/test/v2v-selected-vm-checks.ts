import type { V2vSelectedVmCheck, V2vUnsupportedCheck, V2vVmCheck } from '@/modules/v2v/types/v2v-selected-vm.type.ts'
import type { V2vUnsupportedReason } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { UNKNOWN_POOL_ID } from '@/test/create-pool.ts'

export function createV2vUnsupportedCheck(reason: V2vUnsupportedReason = 'rdm'): V2vUnsupportedCheck {
  return { type: 'unsupported', level: 'blocking', reason }
}

// One check of each type a selected VM can get
export const V2V_SELECTED_VM_CHECK = {
  ready: { type: 'ready', level: 'ready' },
  notFound: { type: 'not-found', level: 'blocking' },
  unsupported: createV2vUnsupportedCheck(),
  running: { type: 'running', level: 'blocking' },
  partialOnOtherPool: { type: 'partial-on-other-pool', level: 'blocking', poolId: UNKNOWN_POOL_ID },
  mappingIncomplete: { type: 'mapping-incomplete', level: 'blocking' },
  alreadyMigrated: { type: 'already-migrated', level: 'warning' },
} as const satisfies Record<string, V2vSelectedVmCheck>

// The checks a source VM passes
export const V2V_VM_CHECK = {
  noUnsupportedDisk: { type: 'no-unsupported-disk', level: 'ready' },
  noSnapshot: { type: 'no-snapshot', level: 'ready' },
} as const satisfies Record<string, V2vVmCheck>
