import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { V2vDestinationDefaults } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import type {
  V2vMappingSummary,
  V2vReadinessLevel,
  V2vSelectedVmCheck,
  V2vSelectedVmKind,
} from '@/modules/v2v/types/v2v-selected-vm.type.ts'
import type { V2vVmRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { countOccurrences } from '@/shared/utils/count.util.ts'

export const V2V_READINESS_LEVELS = ['ready', 'warning', 'blocking'] as const

type V2vSelectedVmRow = Pick<V2vVmRow, 'migration' | 'unsupportedReason' | 'importVm'>

export type V2vMappingResources = {
  srs: Pick<FrontXoSr, 'id' | 'name_label'>[]
  networks: Pick<FrontXoNetwork, 'id' | 'name_label'>[]
}

// Only a warm import can be resumed: the pool it was synced to decides where
function getWarmImportPoolId(row: V2vSelectedVmRow): FrontXoPool['id'] | undefined {
  return row.migration === 'warm' ? row.importVm?.$pool : undefined
}

export function getV2vSelectedVmKind(
  row: V2vSelectedVmRow | undefined,
  poolId: FrontXoPool['id'] | undefined
): V2vSelectedVmKind {
  const warmImportPoolId = row === undefined ? undefined : getWarmImportPoolId(row)

  const isResumed = warmImportPoolId !== undefined && warmImportPoolId === poolId

  return isResumed ? 'resume' : 'new'
}

// The first check that applies wins: the list may outlive the VM, its disks or its import state
export function getV2vSelectedVmCheck(
  row: V2vSelectedVmRow | undefined,
  poolId: FrontXoPool['id'] | undefined
): V2vSelectedVmCheck {
  if (row === undefined) {
    return { type: 'not-found', level: 'blocking' }
  }

  if (row.unsupportedReason !== undefined) {
    return { type: 'unsupported', level: 'blocking', reason: row.unsupportedReason }
  }

  if (row.migration === 'running') {
    return { type: 'running', level: 'blocking' }
  }

  const warmImportPoolId = getWarmImportPoolId(row)

  const isPartialOnOtherPool = warmImportPoolId !== undefined && warmImportPoolId !== poolId

  if (isPartialOnOtherPool) {
    return { type: 'partial-on-other-pool', level: 'blocking', poolId: warmImportPoolId }
  }

  if (row.migration === 'cold') {
    return { type: 'already-migrated', level: 'warning' }
  }

  return { type: 'ready', level: 'ready' }
}

// A resumed VM keeps the mapping of its warm sync: the list defaults only apply to a new one
export function getV2vMappingSummary(
  row: Pick<V2vVmRow, 'vm'> | undefined,
  kind: V2vSelectedVmKind,
  defaults: V2vDestinationDefaults,
  { srs, networks }: V2vMappingResources
): V2vMappingSummary | undefined {
  if (row === undefined) {
    return undefined
  }

  if (kind === 'resume') {
    return { type: 'locked' }
  }

  return {
    type: 'defaults',
    diskCount: row.vm.disks.length,
    srName: srs.find(sr => sr.id === defaults.sr)?.name_label,
    nicCount: row.vm.nics.length,
    networkName: networks.find(network => network.id === defaults.network)?.name_label,
  }
}

export function countV2vReadiness(levels: V2vReadinessLevel[]): Record<V2vReadinessLevel, number> {
  return countOccurrences(V2V_READINESS_LEVELS, levels)
}
