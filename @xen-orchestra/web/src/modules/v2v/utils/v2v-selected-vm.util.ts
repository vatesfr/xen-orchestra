import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { V2vVmMapping, V2vVmMappingState } from '@/modules/v2v/types/v2v-mapping.type.ts'
import type {
  V2vMappingSummary,
  V2vSelectedVmCheck,
  V2vSelectedVmKind,
  V2vSelectedVmState,
} from '@/modules/v2v/types/v2v-selected-vm.type.ts'
import type { V2vVmRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { getV2vUnsupportedCheck } from '@/modules/v2v/utils/v2v-vm-checks.util.ts'
import { uniq } from 'lodash-es'

export const V2V_READINESS_LEVELS = ['ready', 'warning', 'blocking'] as const

type V2vSelectedVmRow = Pick<V2vVmRow, 'migration' | 'unsupportedReason' | 'importVm'>

// A name is `undefined` while its collection loads
export type V2vMappingTargetNameGetters = {
  getSrName: (id: FrontXoSr['id']) => string | undefined
  getNetworkName: (id: FrontXoNetwork['id']) => string | undefined
}

// No pool means nothing to compare the warm import with: it is neither resumed nor on another pool
function getWarmImportPoolId(row: V2vSelectedVmRow, poolId: FrontXoPool['id'] | undefined) {
  return row.migration === 'warm' && poolId !== undefined ? row.importVm?.$pool : undefined
}

// The first check that applies wins: the list may outlive the disks or the import state of the VM
function getCheck(
  row: V2vSelectedVmRow,
  otherPoolId: FrontXoPool['id'] | undefined,
  isMappingIncomplete: boolean
): V2vSelectedVmCheck {
  if (row.unsupportedReason !== undefined) {
    return getV2vUnsupportedCheck(row.unsupportedReason)
  }

  if (row.migration === 'running') {
    return { type: 'running', level: 'blocking' }
  }

  if (otherPoolId !== undefined) {
    return { type: 'partial-on-other-pool', level: 'blocking', poolId: otherPoolId }
  }

  if (isMappingIncomplete) {
    return { type: 'mapping-incomplete', level: 'blocking' }
  }

  if (row.migration === 'cold') {
    return { type: 'already-migrated', level: 'warning' }
  }

  return { type: 'ready', level: 'ready' }
}

// Only a warm import can be resumed, on the pool it was synced to: synced to another pool, it blocks the VM. A resumed
// VM keeps the mapping of its first sync: the state of the mapping of the list does not apply to it
export function getV2vSelectedVmState(
  row: V2vSelectedVmRow | undefined,
  poolId: FrontXoPool['id'] | undefined,
  mappingState?: V2vVmMappingState
): V2vSelectedVmState {
  if (row === undefined) {
    return { kind: 'new', check: { type: 'not-found', level: 'blocking' } }
  }

  const warmImportPoolId = getWarmImportPoolId(row, poolId)

  const isResumed = warmImportPoolId !== undefined && warmImportPoolId === poolId

  return {
    kind: isResumed ? 'resume' : 'new',
    check: getCheck(row, isResumed ? undefined : warmImportPoolId, !isResumed && mappingState === 'incomplete'),
  }
}

// What the list tells of a VM beyond the checks of its source, which already tell an unsupported one
export function isV2vListIssue(check: V2vSelectedVmCheck): boolean {
  return check.type !== 'ready' && check.type !== 'unsupported'
}

// Distinct names, not ids: two SRs may share a name, such as the local SR of each host
function getDistinctTargetNames<TId>(ids: TId[], getName: (id: TId) => string | undefined): string[] | undefined {
  const names = ids.map(getName)

  return names.every(name => name !== undefined) ? uniq(names) : undefined
}

// A resumed VM keeps the mapping of its warm sync: the list only maps a new one
export function getV2vMappingSummary(
  mapping: Pick<V2vVmMapping, 'disks' | 'nics'> | undefined,
  kind: V2vSelectedVmKind,
  { getSrName, getNetworkName }: V2vMappingTargetNameGetters
): V2vMappingSummary | undefined {
  if (mapping === undefined) {
    return undefined
  }

  if (kind === 'resume') {
    return { type: 'locked' }
  }

  return {
    type: 'mapped',
    diskCount: mapping.disks.length,
    srNames: getDistinctTargetNames(
      mapping.disks.map(({ sr }) => sr.value),
      getSrName
    ),
    nicCount: mapping.nics.length,
    networkNames: getDistinctTargetNames(
      mapping.nics.map(({ network }) => network.value),
      getNetworkName
    ),
  }
}
