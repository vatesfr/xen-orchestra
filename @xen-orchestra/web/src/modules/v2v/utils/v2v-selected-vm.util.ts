import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type {
  V2vMappingSummary,
  V2vSelectedVmCheck,
  V2vSelectedVmKind,
  V2vSelectedVmState,
} from '@/modules/v2v/types/v2v-selected-vm.type.ts'
import type { V2vVmRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'

export const V2V_READINESS_LEVELS = ['ready', 'warning', 'blocking'] as const

type V2vSelectedVmRow = Pick<V2vVmRow, 'migration' | 'unsupportedReason' | 'importVm'>

// Names stay `undefined` while their collection loads
export type V2vMappingTargetNames = {
  srName?: string
  networkName?: string
}

// No pool means nothing to compare the warm import with: it is neither resumed nor on another pool
function getWarmImportPoolId(row: V2vSelectedVmRow, poolId: FrontXoPool['id'] | undefined) {
  return row.migration === 'warm' && poolId !== undefined ? row.importVm?.$pool : undefined
}

// The first check that applies wins: the list may outlive the disks or the import state of the VM
function getCheck(row: V2vSelectedVmRow, otherPoolId: FrontXoPool['id'] | undefined): V2vSelectedVmCheck {
  if (row.unsupportedReason !== undefined) {
    return { type: 'unsupported', level: 'blocking', reason: row.unsupportedReason }
  }

  if (row.migration === 'running') {
    return { type: 'running', level: 'blocking' }
  }

  if (otherPoolId !== undefined) {
    return { type: 'partial-on-other-pool', level: 'blocking', poolId: otherPoolId }
  }

  if (row.migration === 'cold') {
    return { type: 'already-migrated', level: 'warning' }
  }

  return { type: 'ready', level: 'ready' }
}

// Only a warm import can be resumed, on the pool it was synced to: synced to another pool, it blocks the VM
export function getV2vSelectedVmState(
  row: V2vSelectedVmRow | undefined,
  poolId: FrontXoPool['id'] | undefined
): V2vSelectedVmState {
  if (row === undefined) {
    return { kind: 'new', check: { type: 'not-found', level: 'blocking' } }
  }

  const warmImportPoolId = getWarmImportPoolId(row, poolId)

  const isResumed = warmImportPoolId !== undefined && warmImportPoolId === poolId

  return {
    kind: isResumed ? 'resume' : 'new',
    check: getCheck(row, isResumed ? undefined : warmImportPoolId),
  }
}

// A resumed VM keeps the mapping of its warm sync: the list defaults only apply to a new one
export function getV2vMappingSummary(
  row: Pick<V2vVmRow, 'vm'> | undefined,
  kind: V2vSelectedVmKind,
  { srName, networkName }: V2vMappingTargetNames
): V2vMappingSummary | undefined {
  if (row === undefined) {
    return undefined
  }

  if (kind === 'resume') {
    return { type: 'locked' }
  }

  return { type: 'defaults', diskCount: row.vm.disks.length, srName, nicCount: row.vm.nics.length, networkName }
}
