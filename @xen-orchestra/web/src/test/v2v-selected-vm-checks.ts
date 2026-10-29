import type { V2vSelectedVmCheck } from '@/modules/v2v/types/v2v-selected-vm.type.ts'
import { getV2vUnsupportedCheck } from '@/modules/v2v/utils/v2v-vm-checks.util.ts'
import { UNKNOWN_POOL_ID } from '@/test/create-pool.ts'

// One check of each type a selected VM can get
export const V2V_SELECTED_VM_CHECK = {
  ready: { type: 'ready', level: 'ready' },
  notFound: { type: 'not-found', level: 'blocking' },
  unsupported: getV2vUnsupportedCheck('rdm'),
  running: { type: 'running', level: 'blocking' },
  partialOnOtherPool: { type: 'partial-on-other-pool', level: 'blocking', poolId: UNKNOWN_POOL_ID },
  mappingIncomplete: { type: 'mapping-incomplete', level: 'blocking' },
  alreadyMigrated: { type: 'already-migrated', level: 'warning' },
} as const satisfies Record<string, V2vSelectedVmCheck>
